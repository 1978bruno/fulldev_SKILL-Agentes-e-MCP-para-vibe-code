export interface PasswordPrompt {
  ask(question: string): Promise<string>;
}

const ENTER = new Set(['\r', '\n']);
const CTRL_C = '\u0003';
const CTRL_U = '\u0015';
const BACKSPACE = new Set(['\u007f', '\b']);

// Lê a senha do terminal sem eco. Sem terminal (entrada redirecionada), lê uma linha da
// entrada padrão. Nunca de argumento nem de variável de ambiente.
export class TtyPasswordPrompt implements PasswordPrompt {
  // O que chegou depois da resposta (a confirmação pode vir no mesmo pedaço que a senha, colada
  // no terminal ou redirecionada) fica para a próxima pergunta.
  private pending = '';
  private ended = false;
  // No terminal, um Enter pode chegar como "\r\n", às vezes partido entre dois pedaços: o "\n"
  // logo depois de um "\r" não é uma segunda resposta vazia.
  private skipLineFeed = false;

  constructor(
    private readonly input: NodeJS.ReadStream = process.stdin,
    private readonly output: NodeJS.WriteStream = process.stderr,
  ) {}

  ask(question: string): Promise<string> {
    this.output.write(question);
    return this.input.isTTY ? this.readRaw() : this.readLine();
  }

  private readRaw(): Promise<string> {
    return new Promise((resolve, reject) => {
      let password = '';
      const finish = (error?: Error) => {
        this.input.setRawMode(false);
        this.input.pause();
        this.input.removeListener('data', onData);
        this.output.write('\n');
        if (error) reject(error);
        else resolve(password);
      };
      // Devolve true quando a pergunta terminou; o que vem depois do Enter (a confirmação colada
      // junto com a senha) fica em pending para a próxima pergunta.
      const consume = (chunk: string): boolean => {
        const chars = Array.from(chunk);
        for (let i = 0; i < chars.length; i += 1) {
          const char = chars[i];
          const skip = this.skipLineFeed && char === '\n';
          this.skipLineFeed = false;
          if (skip) continue;
          if (ENTER.has(char)) {
            this.skipLineFeed = char === '\r';
            this.pending = chars.slice(i + 1).join('');
            finish();
            return true;
          }
          if (char === CTRL_C) {
            finish(new Error('Cancelado.'));
            return true;
          }
          if (char === CTRL_U) password = '';
          // Apaga o último ponto de código inteiro, e não meio par de surrogates (um emoji).
          else if (BACKSPACE.has(char))
            password = Array.from(password).slice(0, -1).join('');
          else password += char;
        }
        return false;
      };
      const onData = (chunk: string) => {
        consume(chunk);
      };
      this.input.setRawMode(true);
      this.input.setEncoding('utf8');
      if (consume(this.drainPending())) return;
      this.input.on('data', onData);
      this.input.resume();
    });
  }

  private readLine(): Promise<string> {
    return new Promise((resolve) => {
      const takeLine = (): boolean => {
        const end = this.pending.indexOf('\n');
        if (end < 0) return false;
        const line = this.pending.slice(0, end).replace(/\r$/, '');
        this.pending = this.pending.slice(end + 1);
        resolve(line);
        return true;
      };
      if (takeLine()) return;
      if (this.ended) return resolve(this.drainPending());
      this.input.setEncoding('utf8');
      const onData = (chunk: string) => {
        this.pending += chunk;
        if (takeLine()) stop();
      };
      const onEnd = () => {
        this.ended = true;
        stop();
        resolve(this.drainPending());
      };
      const stop = () => {
        this.input.removeListener('data', onData);
        this.input.removeListener('end', onEnd);
        this.input.pause();
      };
      this.input.on('data', onData);
      this.input.on('end', onEnd);
      this.input.resume();
    });
  }

  private drainPending(): string {
    const rest = this.pending;
    this.pending = '';
    return rest;
  }
}
