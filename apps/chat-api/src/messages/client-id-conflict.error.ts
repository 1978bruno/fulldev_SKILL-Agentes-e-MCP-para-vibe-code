import { DomainError } from '../common/errors/domain.error';

// O mesmo `client_id` do mesmo autor já gravou uma Mensagem em outra Conversa: não é um reenvio
// desta, e devolver aquela Mensagem a mostraria na Conversa errada.
export class ClientIdConflictError extends DomainError {
  readonly code = 'validation_failed';

  constructor() {
    super('Este identificador de envio já foi usado em outra Conversa.');
  }
}
