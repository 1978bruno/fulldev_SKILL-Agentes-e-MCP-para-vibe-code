import { DomainError } from '../common/errors/domain.error';

// Só um Canal privado perde Membros pelo comando: o público inclui todo o workspace (spec da F04,
// "Comando de canais").
export class ChannelNotPrivateError extends DomainError {
  readonly code = 'validation_failed';

  constructor(readonly name: string) {
    super(
      `#${name} é público: só é possível remover Membros de um Canal privado.`,
    );
  }
}
