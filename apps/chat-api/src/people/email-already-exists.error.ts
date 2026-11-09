import { DomainError } from '../common/errors/domain.error';

export class EmailAlreadyExistsError extends DomainError {
  readonly code = 'email_already_exists';

  constructor(readonly email: string) {
    super(`Já existe uma Pessoa com o e-mail ${email}.`);
  }
}
