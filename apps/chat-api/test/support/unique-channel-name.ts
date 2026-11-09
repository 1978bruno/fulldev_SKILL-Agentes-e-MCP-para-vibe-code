import { randomUUID } from 'node:crypto';

// Nome de Canal único por teste: criar um Canal público inclui todas as Pessoas do banco de
// testes, então cada teste confere só os próprios Canais.
export function uniqueChannelName(prefix = 'canal'): string {
  return `${prefix}-${randomUUID()}`;
}
