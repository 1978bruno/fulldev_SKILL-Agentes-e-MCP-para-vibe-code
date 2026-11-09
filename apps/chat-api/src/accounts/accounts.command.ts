import { isEmail } from 'class-validator';
import { Command, CommandOutput } from '../common/cli/command';
import { DomainError } from '../common/errors/domain.error';
import { ConversationsService } from '../conversations/conversations.service';
import { normalizeEmail } from '../people/normalize-email';
import { PASSWORD_MAX_LENGTH } from '../people/password-policy';
import { PeopleService } from '../people/people.service';
import { PersonNotFoundError } from '../people/person-not-found.error';
import { Person } from '../people/person.entity';
import { SessionsService } from '../sessions/sessions.service';
import { PasswordPrompt } from './password-prompt';

const USAGE = `Uso: pnpm accounts <operação> [argumentos]

Operações:
  create <e-mail> <nome>     Cria a conta de uma Pessoa, já nos Canais públicos; a senha é lida do terminal
  reset-password <e-mail>    Troca a senha (lida do terminal) e revoga todas as Sessões
  revoke-sessions <e-mail>   Apaga todas as Sessões da Pessoa
  purge-expired-sessions     Apaga as Sessões vencidas`;

// Comando de contas de quem opera a instalação (spec da F01, "Comando de contas").
// Devolve o código de saída do processo.
export class AccountsCommand implements Command {
  constructor(
    private readonly people: PeopleService,
    private readonly conversations: ConversationsService,
    private readonly sessions: SessionsService,
    private readonly prompt: PasswordPrompt,
    private readonly output: CommandOutput,
  ) {}

  async run(args: string[]): Promise<number> {
    const [operation, ...rest] = args;
    try {
      switch (operation) {
        case 'create':
          return await this.create(rest);
        case 'reset-password':
          return await this.resetPassword(rest);
        case 'revoke-sessions':
          return await this.revokeSessions(rest);
        case 'purge-expired-sessions':
          return await this.purgeExpiredSessions();
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
    const password = await this.askNewPassword('Senha: ');
    if (!password) return 1;
    // A Pessoa entra em todos os Canais públicos na mesma transação (spec da F02, história 11).
    const person = await this.conversations.createPersonInPublicChannels({
      email,
      name,
      password,
    });
    this.output.info(`Pessoa criada: ${person.email} (${person.id}).`);
    return 0;
  }

  // A troca do hash e a revogação das Sessões são uma transação só: uma falha no meio não deixa
  // a senha nova com as Sessões antigas. Um login que conferiu a senha antiga ao mesmo tempo não
  // cria Sessão (SessionsService.startSession).
  private async resetPassword([email]: string[]): Promise<number> {
    const person = await this.requirePerson(email, 'reset-password <e-mail>');
    if (!person) return 1;
    const password = await this.askNewPassword('Senha nova: ');
    if (!password) return 1;
    const revoked = await this.people.changePassword(
      person.id,
      password,
      (manager) => this.sessions.revokeAll(person.id, manager),
    );
    this.output.info(
      `Senha trocada para ${person.email}; ${revoked} Sessão(ões) revogada(s).`,
    );
    return 0;
  }

  private async revokeSessions([email]: string[]): Promise<number> {
    const person = await this.requirePerson(email, 'revoke-sessions <e-mail>');
    if (!person) return 1;
    const revoked = await this.sessions.revokeAll(person.id);
    this.output.info(`${revoked} Sessão(ões) revogada(s) de ${person.email}.`);
    return 0;
  }

  private async purgeExpiredSessions(): Promise<number> {
    const purged = await this.sessions.purgeExpired();
    this.output.info(`${purged} Sessão(ões) vencida(s) apagada(s).`);
    return 0;
  }

  private async requirePerson(
    email: string | undefined,
    usage: string,
  ): Promise<Person | null> {
    if (!email?.trim()) {
      this.output.error(`Uso: pnpm accounts ${usage}`);
      return null;
    }
    const person = await this.people.findByEmail(email);
    if (!person) throw new PersonNotFoundError(normalizeEmail(email));
    return person;
  }

  // A senha é digitada sem eco: pede duas vezes, para um erro de digitação não travar a conta.
  private async askNewPassword(question: string): Promise<string | null> {
    const password = await this.prompt.ask(question);
    if (!password) {
      this.output.error('A senha não pode ser vazia.');
      return null;
    }
    // Conta pontos de código, como o @MaxLength do login (um emoji vale um).
    if (Array.from(password).length > PASSWORD_MAX_LENGTH) {
      this.output.error(
        `A senha pode ter no máximo ${PASSWORD_MAX_LENGTH} caracteres.`,
      );
      return null;
    }
    const confirmation = await this.prompt.ask('Confirme a senha: ');
    if (confirmation !== password) {
      this.output.error('As senhas não conferem.');
      return null;
    }
    return password;
  }
}
