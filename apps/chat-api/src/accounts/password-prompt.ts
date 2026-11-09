export interface PasswordPrompt {
  ask(question: string): Promise<string>;
}

// Lê a senha do terminal sem eco. Sem terminal (entrada redirecionada), lê uma linha da
// entrada padrão. Nunca de argumento nem de variável de ambiente.
export class TtyPasswordPrompt implements PasswordPrompt {
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
          if (char === '\r' || char === '\n') return finish();
          if (char === '\u0003') return finish(new Error('Cancelado.'));
          if (char === '\u007f' || char === '\b')
            // Apaga o último ponto de código inteiro, e não meio par de surrogates (um emoji).
            password = Array.from(password).slice(0, -1).join('');
          else password += char;
        }
      };
      this.input.on('data', onData);
    });
  }

  private readLine(): Promise<string> {
    return new Promise((resolve) => {
      let buffer = '';
      this.input.setEncoding('utf8');
      const onData = (chunk: string) => {
        buffer += chunk;
        const end = buffer.indexOf('\n');
        if (end >= 0) {
          this.input.removeListener('data', onData);
          this.input.pause();
          resolve(buffer.slice(0, end).replace(/\r$/, ''));
        }
      };
      this.input.on('data', onData);
      this.input.on('end', () => resolve(buffer));
      this.input.resume();
    });
  }
}
