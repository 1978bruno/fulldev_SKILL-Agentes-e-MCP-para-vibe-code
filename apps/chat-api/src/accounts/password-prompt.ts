export interface PasswordPrompt {
  ask(question: string): Promise<string>;
}

const ENTER = new Set(['\r', '\n']);
const CTRL_C = '\u0003';
const CTRL_U = '\u0015';
const ESC = '\u001b';

const BACKSPACE = new Set(['\u007f', '\b']);
type EscapeState = 'none' | 'esc' | 'csi' | 'ss3';

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
  // Setas e outras teclas especiais chegam como sequência de escape (CSI: "ESC [" até o byte
  // final entre "@" e "~"; SS3: "ESC O" e mais um caractere), às vezes partida entre pedaços ou
  // junto com texto: o estado atravessa os pedaços, e nada dela entra na senha.
  private escape: EscapeState = 'none';

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
          if (this.skipEscape(char)) continue;
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
          // Outras teclas de controle (Ctrl+D, Tab) não fazem parte da senha.
          else if (char >= ' ') password += char;
        }
        // Um ESC no fim do pedaço é a tecla Esc sozinha: o terminal manda a sequência de uma tecla
        // num pedaço só. Só uma sequência já começada ("ESC [" ou "ESC O") segue no próximo.
        if (this.escape === 'esc') this.escape = 'none';
        return false;
      };
      const onData = (chunk: string) => {
        consume(chunk);
      };
      this.escape = 'none';
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

  // Devolve true quando o caractere faz parte de uma sequência de escape. Um caractere de controle
  // (Enter, Ctrl+C, outro ESC) encerra a sequência e vale normalmente, para ela nunca engolir o
  // Enter; um ESC sem "[" nem "O" depois é só ele.
  private skipEscape(char: string): boolean {
    if (this.escape !== 'none' && char < ' ') this.escape = 'none';
    if (this.escape === 'csi') {
      if (char >= '@' && char <= '~') this.escape = 'none';
      return true;
    }
    if (this.escape === 'ss3') {
      this.escape = 'none';
      return true;
    }
    if (this.escape === 'esc') {
      this.escape = char === '[' ? 'csi' : char === 'O' ? 'ss3' : 'none';
      return this.escape !== 'none';
    }
    if (char !== ESC) return false;
    this.escape = 'esc';
    return true;
  }

  private drainPending(): string {
    const rest = this.pending;
    this.pending = '';
    return rest;
  }
}
