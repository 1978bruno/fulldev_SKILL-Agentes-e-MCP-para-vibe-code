import { createHash, randomBytes } from 'node:crypto';

// Token aleatório de 32 bytes, entregue ao BFF uma vez (LLD, "Segurança").
export function generateSessionToken(): string {
  return randomBytes(32).toString('base64url');
}

export function hashSessionToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
