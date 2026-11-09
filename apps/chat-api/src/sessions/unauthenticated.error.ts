import { DomainError } from '../common/errors/domain.error';

export class UnauthenticatedError extends DomainError {
  readonly code = 'unauthenticated';

  constructor() {
    super('Sessão ausente ou inválida.');
  }
}
