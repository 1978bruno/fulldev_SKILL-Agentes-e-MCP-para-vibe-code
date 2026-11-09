import { DomainError } from '../common/errors/domain.error';

// Conversa inexistente, sem participação ou com id malformado: a mesma resposta, para não
// revelar se a Conversa existe (LLD, "Segurança", "Participação numa Conversa").
export class ConversationNotFoundError extends DomainError {
  readonly code = 'conversation_not_found';

  constructor() {
    super('Conversa não encontrada.');
  }
}
