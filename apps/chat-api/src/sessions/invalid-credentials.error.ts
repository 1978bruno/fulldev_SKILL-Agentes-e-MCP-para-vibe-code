import { DomainError } from '../common/errors/domain.error';

export class InvalidCredentialsError extends DomainError {
  readonly code = 'invalid_credentials';

  constructor() {
    super('E-mail ou senha incorretos.');
  }
}
