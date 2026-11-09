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
  // Na entrada redirecionada, o que chegou depois da linha lida (a confirmação pode vir no
  // mesmo pedaço que a senha) fica para a próxima pergunta.
  private pending = '';
  private ended = false;

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
      this.input.setRawMode(true);
      this.input.resume();
      this.input.setEncoding('utf8');
      const finish = (error?: Error) => {
        this.input.setRawMode(false);
        this.input.pause();
        this.input.removeListener('data', onData);
        this.output.write('\n');
        if (error) reject(error);
        else resolve(password);
      };
      const onData = (chunk: string) => {
        for (const char of chunk) {
          if (ENTER.has(char)) return finish();
          if (char === CTRL_C) return finish(new Error('Cancelado.'));
          if (char === CTRL_U) password = '';
          // Apaga o último ponto de código inteiro, e não meio par de surrogates (um emoji).
          else if (BACKSPACE.has(char))
            password = Array.from(password).slice(0, -1).join('');
          else password += char;
        }
      };
      this.input.on('data', onData);
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
      if (this.ended) {
        const rest = this.pending;
        this.pending = '';
        return resolve(rest);
      }
      this.input.setEncoding('utf8');
      const onData = (chunk: string) => {
        this.pending += chunk;
        if (takeLine()) stop();
      };
      const onEnd = () => {
        this.ended = true;
        stop();
        const rest = this.pending;
        this.pending = '';
        resolve(rest);
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
}
