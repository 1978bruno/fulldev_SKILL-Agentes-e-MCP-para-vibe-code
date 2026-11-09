import { randomUUID } from 'node:crypto';

export function uniqueEmail(prefix = 'pessoa'): string {
  return `${prefix}-${randomUUID()}@teste.local`.toLowerCase();
}
