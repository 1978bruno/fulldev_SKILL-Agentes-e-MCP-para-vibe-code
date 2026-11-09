import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { REDIS_CLIENT, type RedisClient } from '../redis/redis.module';
import { EVENTS_RETENTION_MS } from './realtime-values';

// Um evento guardado por Pessoa, como sai no WebSocket.
export interface StoredEvent<T = unknown> {
  name: string;
  payload: T;
}

export interface ReplayedEvent<T = unknown> extends StoredEvent<T> {
  cursor: string;
}

export type ReadSinceResult =
  | { kind: 'events'; events: ReplayedEvent[]; cursor: string }
  | { kind: 'lost'; cursor: string };

const EPOCH_KEY = 'events:epoch';

// Prazo de cada operação no Redis: um Redis travado, e não fora, não prende o envio nem a conexão.
const REDIS_TIMEOUT_MS = 2_000;

function withTimeout<T>(operation: Promise<T>): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () => reject(new Error('O Redis não respondeu no prazo')),
      REDIS_TIMEOUT_MS,
    );
  });
  return Promise.race([operation, timeout]).finally(() => clearTimeout(timer));
}

function streamKey(personId: string): string {
  return `events:person:${personId}`;
}

// Id do stream do Redis ("<ms>-<seq>") em números, para comparar.
function parseStreamId(id: string): [number, number] | null {
  const match = /^(\d+)-(\d+)$/.exec(id);
  return match ? [Number(match[1]), Number(match[2])] : null;
}

export function compareStreamIds(a: string, b: string): number {
  const [aMs, aSeq] = parseStreamId(a) ?? [0, 0];
  const [bMs, bSeq] = parseStreamId(b) ?? [0, 0];
  return aMs - bMs || aSeq - bSeq;
}

// Lê os campos de texto da resposta do XINFO STREAM, uma lista plana de nome e valor.
function textFieldsOf(reply: unknown): Map<string, string> {
  const fields = new Map<string, string>();
  if (!Array.isArray(reply)) return fields;
  for (let index = 0; index + 1 < reply.length; index += 2) {
    const [name, value] = [
      reply[index] as unknown,
      reply[index + 1] as unknown,
    ];
    if (typeof name === 'string' && typeof value === 'string') {
      fields.set(name, value);
    }
  }
  return fields;
}

// Eventos por Pessoa para a reconexão (spec da F03, "Eventos por Pessoa e reconexão"): um stream
// por Pessoa, cortado pela retenção a cada gravação, e uma época que muda quando o Redis perde os
// dados. O cursor que a aba recebe é "<época>:<id do stream>".
@Injectable()
export class EventsStore {
  // Quando a gravação no Redis falhou para cada Pessoa (Date.now()). A API roda com uma instância só
  // (HLD 6.2), então a memória do processo basta. Toda aba da Pessoa com um cursor anterior à falha
  // recarrega, em vez de reenviar sem o evento que não foi guardado; a marca vale pela retenção.
  private readonly missedAt = new Map<string, number>();

  constructor(@Inject(REDIS_CLIENT) private readonly redis: RedisClient) {}

  markMissed(personIds: string[]): void {
    const now = Date.now();
    personIds.forEach((personId) => this.missedAt.set(personId, now));
  }

  // Se uma gravação falhou para a Pessoa depois do evento do cursor.
  private missedAfter(personId: string, streamId: string): boolean {
    const failedAt = this.missedAt.get(personId);
    if (failedAt === undefined) return false;
    if (Date.now() - failedAt > EVENTS_RETENTION_MS) {
      this.missedAt.delete(personId);
      return false;
    }
    const [cursorMs] = parseStreamId(streamId) ?? [0];
    return cursorMs <= failedAt;
  }

  // Grava o evento no stream de cada Pessoa e devolve o cursor de cada uma: a época vai no mesmo
  // pipeline das gravações. O evento pode ser o mesmo para todas ou montado para cada uma.
  async append(
    personIds: string[],
    event: StoredEvent | ((personId: string) => StoredEvent),
  ): Promise<Map<string, string>> {
    const minId = `${Date.now() - EVENTS_RETENTION_MS}-0`;
    const shared = typeof event === 'function' ? null : JSON.stringify(event);
    const pipeline = this.redis.multi().get(EPOCH_KEY);
    for (const personId of personIds) {
      const data =
        shared ??
        JSON.stringify((event as (id: string) => StoredEvent)(personId));
      pipeline.addCommand([
        'XADD',
        streamKey(personId),
        'MINID',
        '~',
        minId,
        '*',
        'event',
        data,
      ]);
    }
    const [storedEpoch, ...ids] = (await withTimeout(
      pipeline.execAsPipeline(),
    )) as unknown as [string | null, ...string[]];
    const epoch = storedEpoch ?? (await this.createEpoch());
    return new Map(
      personIds.map((personId, index) => [personId, `${epoch}:${ids[index]}`]),
    );
  }

  // O cursor atual da Pessoa: o último id gerado no stream dela, ou "0-0" sem stream.
  async currentCursor(personId: string): Promise<string> {
    const { epoch, lastId } = await this.streamState(personId);
    return `${epoch}:${lastId}`;
  }

  // Os eventos depois do cursor, ou "perdido". É perdido quando:
  // - a época mudou (o Redis perdeu os dados);
  // - uma gravação falhou para a Pessoa desde a última conexão;
  // - o cursor está à frente do último id do stream (o stream foi despejado ou restaurado);
  // - há eventos mais novos que o cursor e o primeiro que sobrou no stream é posterior a ele, ou
  //   não sobrou nenhum: algum evento depois do cursor pode ter sido cortado. Quando o corte
  //   apagou só o próprio evento do cursor, a regra recarrega sem precisar, mas nunca esconde uma
  //   perda.
  async readSince(personId: string, cursor: string): Promise<ReadSinceResult> {
    const key = streamKey(personId);
    const [cursorEpoch, streamId] = cursor.split(':');
    const hasValidId = Boolean(streamId && parseStreamId(streamId));
    // Numa transação: o primeiro evento que sobrou e os eventos depois do cursor saem do mesmo
    // instante, sem um corte de outra gravação entre as duas leituras.
    const [storedEpoch, exists, firstEntries, entries] = (await withTimeout(
      this.redis
        .multi()
        .get(EPOCH_KEY)
        .exists(key)
        .addCommand(['XRANGE', key, '-', '+', 'COUNT', '1'])
        .addCommand(['XRANGE', key, hasValidId ? `(${streamId}` : '-', '+'])
        .exec(),
    )) as unknown as [
      string | null,
      number,
      [string, string[]][],
      [string, string[]][],
    ];
    const epoch = storedEpoch ?? (await this.createEpoch());
    const lastId = exists ? await this.lastGeneratedId(key) : '0-0';
    const current = `${epoch}:${lastId}`;
    const firstId = firstEntries[0]?.[0] ?? null;
    if (
      cursorEpoch !== epoch ||
      !hasValidId ||
      this.missedAfter(personId, streamId) ||
      compareStreamIds(streamId, lastId) > 0
    ) {
      return { kind: 'lost', cursor: current };
    }
    const hasNewer = compareStreamIds(lastId, streamId) > 0;
    if (hasNewer && (!firstId || compareStreamIds(firstId, streamId) > 0)) {
      return { kind: 'lost', cursor: current };
    }
    const events = entries.map(([id, fields]) => {
      const raw = fields[fields.indexOf('event') + 1];
      return {
        ...(JSON.parse(raw) as StoredEvent),
        cursor: `${epoch}:${id}`,
      };
    });
    return {
      kind: 'events',
      events,
      cursor: events.at(-1)?.cursor ?? cursor,
    };
  }

  private async createEpoch(): Promise<string> {
    await withTimeout(
      this.redis.set(EPOCH_KEY, randomUUID(), { condition: 'NX' }),
    );
    const created = await withTimeout(this.redis.get(EPOCH_KEY));
    if (!created) throw new Error('Época dos eventos ausente depois de criada');
    return created;
  }

  // O cursor atual: a época e o último id gerado no stream da Pessoa.
  private async streamState(
    personId: string,
  ): Promise<{ epoch: string; lastId: string }> {
    const key = streamKey(personId);
    const [storedEpoch, exists] = (await withTimeout(
      this.redis.multi().get(EPOCH_KEY).exists(key).execAsPipeline(),
    )) as unknown as [string | null, number];
    const epoch = storedEpoch ?? (await this.createEpoch());
    return { epoch, lastId: exists ? await this.lastGeneratedId(key) : '0-0' };
  }

  // O último id gerado no stream, que continua valendo depois dos cortes.
  private async lastGeneratedId(key: string): Promise<string> {
    const info = await withTimeout(
      this.redis.sendCommand(['XINFO', 'STREAM', key]),
    );
    return textFieldsOf(info).get('last-generated-id') ?? '0-0';
  }
}
