import { DomainError } from '../common/errors/domain.error';

// Um id que não é de nenhuma Pessoa num pedido que lista Pessoas.
export class InvalidPeopleError extends DomainError {
  readonly code = 'validation_failed';

  constructor() {
    super('Há pessoas que não existem no pedido.');
  }
}
