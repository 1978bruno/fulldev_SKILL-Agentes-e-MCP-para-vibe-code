import { DomainError } from '../common/errors/domain.error';

export class TooManyLoginAttemptsError extends DomainError {
  readonly code = 'too_many_login_attempts';

  constructor(readonly retryAfterSeconds: number) {
    super(
      'Muitas tentativas de entrar. Aguarde alguns minutos e tente de novo.',
    );
  }
}
