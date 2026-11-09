import { DomainError } from '../common/errors/domain.error';

export class ChannelNameTakenError extends DomainError {
  readonly code = 'channel_name_taken';

  constructor(readonly name: string) {
    super(`Já existe um canal com o nome ${name}.`);
  }
}
