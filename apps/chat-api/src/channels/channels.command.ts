import { Command, CommandOutput } from '../common/cli/command';
import { DomainError } from '../common/errors/domain.error';
import { ConversationsService } from '../conversations/conversations.service';

const USAGE = `Uso: pnpm channels <operação> [argumentos]

Operações:
  create <nome> [tópico]     Cria um Canal público, com todas as Pessoas como Membros`;

// Comando de canais de quem opera a instalação (spec da F02, "Comando de canais").
// Devolve o código de saída do processo.
export class ChannelsCommand implements Command {
  constructor(
    private readonly conversations: ConversationsService,
    private readonly output: CommandOutput,
  ) {}

  async run(args: string[]): Promise<number> {
    const [operation, ...rest] = args;
    try {
      switch (operation) {
        case 'create':
          return await this.create(rest);
        default:
          this.output.error(USAGE);
          return 1;
      }
    } catch (error) {
      if (error instanceof DomainError) {
        this.output.error(error.message);
        return 1;
      }
      throw error;
    }
  }

  private async create([name, topic]: string[]): Promise<number> {
    if (name === undefined) {
      this.output.error('Uso: pnpm channels create <nome> [tópico]');
      return 1;
    }
    const channel = await this.conversations.createPublicChannel(name, topic);
    this.output.info(`Canal #${channel.name} criado.`);
    return 0;
  }
}
