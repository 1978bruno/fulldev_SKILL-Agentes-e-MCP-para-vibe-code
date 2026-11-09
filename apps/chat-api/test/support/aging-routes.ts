import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { hashSessionToken } from '../../src/sessions/session-token';

// Atalhos da base de testes para os testes de tempo: envelhecem as linhas no banco no Arrange,
// sem relógio falso e sem overrideProvider (spec da F01, "Decisões de teste").
export const agingRoutes = {
  async ageSession(
    app: INestApplication,
    token: string,
    dates: { lastUsedAt?: Date; expiresAt?: Date },
  ): Promise<void> {
    const tokenHash = hashSessionToken(token);
    await app
      .get(DataSource)
      .query(
        'UPDATE sessions SET last_used_at = COALESCE($2, last_used_at), expires_at = COALESCE($3, expires_at) WHERE token_hash = $1',
        [tokenHash, dates.lastUsedAt ?? null, dates.expiresAt ?? null],
      );
  },

  async ageLoginAttempts(
    app: INestApplication,
    email: string,
    dates: { firstFailedAt?: Date; blockedUntil?: Date },
  ): Promise<void> {
    await app
      .get(DataSource)
      .query(
        'UPDATE login_attempts SET first_failed_at = COALESCE($2, first_failed_at), blocked_until = COALESCE($3, blocked_until) WHERE email = $1',
        [email, dates.firstFailedAt ?? null, dates.blockedUntil ?? null],
      );
  },
};

export function minutesAgo(minutes: number): Date {
  return new Date(Date.now() - minutes * 60 * 1000);
}

export function daysAgo(days: number): Date {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}
