import { DomainError } from '../common/errors/domain.error';

// Nome ou Tópico fora da regra (channel-name.ts); a mensagem diz qual regra.
export class InvalidChannelError extends DomainError {
  readonly code = 'validation_failed';
}
