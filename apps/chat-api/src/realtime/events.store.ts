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
  // As Pessoas que perderam um evento porque a gravação no Redis falhou. A API roda com uma
  // instância só (HLD 6.2), então a memória do processo basta: a reconexão seguinte de cada uma
  // recarrega, em vez de reenviar sem o evento que não foi guardado.
  private readonly missedEvents = new Set<string>();

  constructor(@Inject(REDIS_CLIENT) private readonly redis: RedisClient) {}

  markMissed(personIds: string[]): void {
    personIds.forEach((personId) => this.missedEvents.add(personId));
  }

  // Grava o evento no stream de cada Pessoa e devolve o cursor de cada uma: a época vai no mesmo
  // pipeline das gravações.
  async append(
    personIds: string[],
    event: StoredEvent,
  ): Promise<Map<string, string>> {
    const minId = `${Date.now() - EVENTS_RETENTION_MS}-0`;
    const data = JSON.stringify(event);
    const pipeline = this.redis.multi().get(EPOCH_KEY);
    for (const personId of personIds) {
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
    const { epoch, lastId, firstId } = await this.streamState(personId);
    const current = `${epoch}:${lastId}`;
    const hadMissed = this.missedEvents.delete(personId);
    const [cursorEpoch, streamId] = cursor.split(':');
    if (
      hadMissed ||
      cursorEpoch !== epoch ||
      !streamId ||
      !parseStreamId(streamId) ||
      compareStreamIds(streamId, lastId) > 0
    ) {
      return { kind: 'lost', cursor: current };
    }
    const hasNewer = compareStreamIds(lastId, streamId) > 0;
    if (!hasNewer) return { kind: 'events', events: [], cursor };
    if (!firstId || compareStreamIds(firstId, streamId) > 0) {
      return { kind: 'lost', cursor: current };
    }
    const entries = await withTimeout(
      this.redis.sendCommand<[string, string[]][]>([
        'XRANGE',
        streamKey(personId),
        `(${streamId}`,
        '+',
      ]),
    );
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

  // A época, o último id gerado no stream da Pessoa e o primeiro que sobrou depois dos cortes,
  // num pipeline; o XINFO STREAM só roda quando o stream existe.
  private async streamState(
    personId: string,
  ): Promise<{ epoch: string; lastId: string; firstId: string | null }> {
    const key = streamKey(personId);
    const [storedEpoch, exists, firstEntries] = (await withTimeout(
      this.redis
        .multi()
        .get(EPOCH_KEY)
        .exists(key)
        .addCommand(['XRANGE', key, '-', '+', 'COUNT', '1'])
        .execAsPipeline(),
    )) as unknown as [string | null, number, [string, string[]][]];
    const epoch = storedEpoch ?? (await this.createEpoch());
    if (!exists) return { epoch, lastId: '0-0', firstId: null };
    const info = await withTimeout(
      this.redis.sendCommand(['XINFO', 'STREAM', key]),
    );
    return {
      epoch,
      lastId: textFieldsOf(info).get('last-generated-id') ?? '0-0',
      firstId: firstEntries[0]?.[0] ?? null,
    };
  }
}
