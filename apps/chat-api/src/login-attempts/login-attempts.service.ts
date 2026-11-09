import { randomUUIDv7 } from 'node:crypto';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LoginAttempt } from './login-attempt.entity';
import { maskEmail } from './mask-email';
import { TooManyLoginAttemptsError } from './too-many-login-attempts.error';

// Valores de regra (LLD, "Valores e configuração"): constantes.
export const LOGIN_ATTEMPTS = 5;
const LOGIN_WINDOW = '15 minutes';
const LOGIN_BLOCK = '15 minutes';

@Injectable()
export class LoginAttemptsService {
  private readonly logger = new Logger(LoginAttemptsService.name);

  constructor(
    @InjectRepository(LoginAttempt)
    private readonly attempts: Repository<LoginAttempt>,
  ) {}

  // Durante o bloqueio, toda tentativa é recusada com o tempo que falta, sem contar nem estender.
  async assertNotBlocked(email: string): Promise<void> {
    const rows = await this.attempts.query<{ retry_after: number }[]>(
      `SELECT CEIL(EXTRACT(EPOCH FROM (blocked_until - now())))::int AS retry_after
         FROM login_attempts
        WHERE email = $1 AND blocked_until > now()`,
      [email],
    );
    if (rows.length === 0) return;
    this.logger.warn(`Tentativa de login bloqueada para ${maskEmail(email)}`);
    throw new TooManyLoginAttemptsError(Math.max(1, rows[0].retry_after));
  }

  // Upsert atômico: o incremento mora no próprio UPDATE, para duas falhas simultâneas contarem
  // as duas. Uma falha depois de vencida a janela, ou depois de um bloqueio que já passou,
  // recomeça a contagem em 1; a de número LOGIN_ATTEMPTS dentro da janela bloqueia. O WHERE
  // impede que uma falha que corre com o bloqueio o estenda.
  async recordFailure(email: string): Promise<void> {
    await this.attempts.query(
      `INSERT INTO login_attempts (id, email, failed_count, first_failed_at, blocked_until)
       VALUES ($1, $2, 1, now(), CASE WHEN 1 >= $3 THEN now() + $5::interval END)
       ON CONFLICT (email) DO UPDATE SET
         failed_count = CASE
           WHEN login_attempts.first_failed_at <= now() - $4::interval
             OR login_attempts.blocked_until IS NOT NULL THEN 1
           ELSE login_attempts.failed_count + 1 END,
         first_failed_at = CASE
           WHEN login_attempts.first_failed_at <= now() - $4::interval
             OR login_attempts.blocked_until IS NOT NULL THEN now()
           ELSE login_attempts.first_failed_at END,
         blocked_until = CASE
           WHEN login_attempts.first_failed_at > now() - $4::interval
            AND login_attempts.blocked_until IS NULL
            AND login_attempts.failed_count + 1 >= $3 THEN now() + $5::interval
           ELSE NULL END,
         updated_at = now()
       WHERE login_attempts.blocked_until IS NULL OR login_attempts.blocked_until <= now()`,
      [randomUUIDv7(), email, LOGIN_ATTEMPTS, LOGIN_WINDOW, LOGIN_BLOCK],
    );
  }

  // Um login certo fora do bloqueio apaga a contagem. A condição protege um bloqueio que outra
  // tentativa gravou enquanto este login conferia a senha.
  async clear(email: string): Promise<void> {
    await this.attempts.query(
      `DELETE FROM login_attempts
        WHERE email = $1 AND (blocked_until IS NULL OR blocked_until <= now())`,
      [email],
    );
  }
}
