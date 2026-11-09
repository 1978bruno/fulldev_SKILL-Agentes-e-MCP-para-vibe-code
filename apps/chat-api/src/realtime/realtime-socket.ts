import type { ClientToServerEvents, ServerToClientEvents } from 'chat-events';
import type { Server, Socket } from 'socket.io';
import type { Person } from '../people/person.entity';

// O que o handshake grava no socket depois de verificar a Sessão.
export interface RealtimeSocketData {
  person: Person;
  sessionId: string;
}

export type RealtimeServer = Server<
  ClientToServerEvents,
  ServerToClientEvents,
  Record<string, never>,
  RealtimeSocketData
>;

export type RealtimeSocket = Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  Record<string, never>,
  RealtimeSocketData
>;

export function personRoom(personId: string): string {
  return `person:${personId}`;
}

export function sessionRoom(sessionId: string): string {
  return `session:${sessionId}`;
}
