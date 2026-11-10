import { DomainError } from '../common/errors/domain.error';

// Só o Canal privado aceita adicionar Pessoas: o público já inclui todo o workspace (spec da F04,
// "Conversas", "Adicionar ao Canal").
export class MembersNotEditableError extends DomainError {
  readonly code = 'members_not_editable';

  constructor() {
    super('Só é possível adicionar pessoas a um canal privado.');
  }
}
