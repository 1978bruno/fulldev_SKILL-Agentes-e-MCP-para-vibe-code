import { DomainError } from '../common/errors/domain.error';

// Nenhum Canal público com o nome pedido ao comando de canais (um Canal é uma Conversa).
export class ChannelNotFoundError extends DomainError {
  readonly code = 'conversation_not_found';

  constructor(readonly name: string) {
    super(`Canal não encontrado: ${name}.`);
  }
}
