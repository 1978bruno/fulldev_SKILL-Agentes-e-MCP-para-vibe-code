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
  constructor(@Inject(REDIS_CLIENT) private readonly redis: RedisClient) {}

  // A época atual, criada quando falta.
  async epoch(): Promise<string> {
    const current = await this.redis.get(EPOCH_KEY);
    if (current) return current;
    await this.redis.set(EPOCH_KEY, randomUUID(), { condition: 'NX' });
    const created = await this.redis.get(EPOCH_KEY);
    if (!created) throw new Error('Época dos eventos ausente depois de criada');
    return created;
  }

  // Grava o evento no stream de cada Pessoa, num pipeline, e devolve o cursor de cada uma.
  async append(
    personIds: string[],
    event: StoredEvent,
  ): Promise<Map<string, string>> {
    const epoch = await this.epoch();
    const minId = `${Date.now() - EVENTS_RETENTION_MS}-0`;
    const data = JSON.stringify(event);
    const pipeline = this.redis.multi();
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
    const ids = (await pipeline.execAsPipeline()) as unknown as string[];
    return new Map(
      personIds.map((personId, index) => [personId, `${epoch}:${ids[index]}`]),
    );
  }

  // O cursor atual da Pessoa: o último id gerado no stream dela, ou "0-0" sem stream.
  async currentCursor(personId: string): Promise<string> {
    const epoch = await this.epoch();
    const info = await this.streamInfo(personId);
    return `${epoch}:${info.lastId}`;
  }

  // Os eventos depois do cursor, ou "perdido" quando a época mudou ou quando pode haver evento
  // posterior a ele já cortado: há eventos mais novos que o cursor e o primeiro que sobrou no
  // stream é posterior a ele (ou não sobrou nenhum). Quando o próprio evento do cursor foi cortado,
  // a regra recarrega sem precisar, mas nunca esconde uma perda.
  async readSince(personId: string, cursor: string): Promise<ReadSinceResult> {
    const epoch = await this.epoch();
    const info = await this.streamInfo(personId);
    const current = `${epoch}:${info.lastId}`;
    const [cursorEpoch, streamId] = cursor.split(':');
    if (cursorEpoch !== epoch || !streamId || !parseStreamId(streamId)) {
      return { kind: 'lost', cursor: current };
    }
    const hasNewer = compareStreamIds(info.lastId, streamId) > 0;
    if (
      hasNewer &&
      (!info.firstId || compareStreamIds(info.firstId, streamId) > 0)
    ) {
      return { kind: 'lost', cursor: current };
    }
    const entries = await this.redis.sendCommand<[string, string[]][]>([
      'XRANGE',
      streamKey(personId),
      `(${streamId}`,
      '+',
    ]);
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

  // O último id gerado no stream da Pessoa e o primeiro que sobrou depois dos cortes.
  private async streamInfo(
    personId: string,
  ): Promise<{ lastId: string; firstId: string | null }> {
    let reply: unknown;
    try {
      reply = await this.redis.sendCommand([
        'XINFO',
        'STREAM',
        streamKey(personId),
      ]);
    } catch (error) {
      // Sem stream, a Pessoa ainda não recebeu evento: nada foi apagado.
      if (error instanceof Error && /no such key/i.test(error.message)) {
        return { lastId: '0-0', firstId: null };
      }
      throw error;
    }
    const [first] = await this.redis.sendCommand<[string, string[]][]>([
      'XRANGE',
      streamKey(personId),
      '-',
      '+',
      'COUNT',
      '1',
    ]);
    return {
      lastId: textFieldsOf(reply).get('last-generated-id') ?? '0-0',
      firstId: first?.[0] ?? null,
    };
  }
}
