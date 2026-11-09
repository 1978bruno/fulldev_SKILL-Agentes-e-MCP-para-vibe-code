import { isEmail } from 'class-validator';
import { DomainError } from '../common/errors/domain.error';
import { PeopleService } from '../people/people.service';
import { PasswordPrompt } from './password-prompt';

export interface CommandOutput {
  info(message: string): void;
  error(message: string): void;
}

// O mesmo teto da senha no login (LoginDto): acima dele, a conta nunca conseguiria entrar.
const PASSWORD_MAX_LENGTH = 256;

const USAGE = `Uso: pnpm accounts <operação> [argumentos]

Operações:
  create <e-mail> <nome>   Cria a conta de uma Pessoa; a senha é lida do terminal`;

// Comando de contas de quem opera a instalação (spec da F01, "Comando de contas").
// Devolve o código de saída do processo.
export class AccountsCommand {
  constructor(
    private readonly people: PeopleService,
    private readonly prompt: PasswordPrompt,
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

  private async create([email, name]: string[]): Promise<number> {
    if (!email?.trim() || !name?.trim()) {
      this.output.error('Uso: pnpm accounts create <e-mail> <nome>');
      return 1;
    }
    // O mesmo formato que o login aceita; fora dele, a conta nunca conseguiria entrar.
    if (!isEmail(email.trim())) {
      this.output.error(`E-mail inválido: ${email.trim()}`);
      return 1;
    }
    const password = await this.prompt.ask('Senha: ');
    if (!password) {
      this.output.error('A senha não pode ser vazia.');
      return 1;
    }
    if (password.length > PASSWORD_MAX_LENGTH) {
      this.output.error(
        `A senha pode ter no máximo ${PASSWORD_MAX_LENGTH} caracteres.`,
      );
      return 1;
    }
    const person = await this.people.create({ email, name, password });
    this.output.info(`Pessoa criada: ${person.email} (${person.id}).`);
    return 0;
  }
}
