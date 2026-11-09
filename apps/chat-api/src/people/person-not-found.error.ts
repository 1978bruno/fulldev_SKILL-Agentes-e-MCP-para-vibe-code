import { DomainError } from '../common/errors/domain.error';

export class PersonNotFoundError extends DomainError {
  readonly code = 'person_not_found';

  constructor(readonly email: string) {
    super(`Nenhuma Pessoa com o e-mail ${email}.`);
  }
}
