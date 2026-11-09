import { PassThrough } from 'node:stream';
import { TtyPasswordPrompt } from './password-prompt';

function prompt(input: PassThrough, isTTY = false) {
  Object.assign(input, { isTTY, setRawMode: () => input });
  const output = new PassThrough();
  return new TtyPasswordPrompt(
    input as unknown as NodeJS.ReadStream,
    output as unknown as NodeJS.WriteStream,
  );
}

describe('TtyPasswordPrompt', () => {
  it('na entrada redirecionada, guarda a confirmação que chegou junto com a senha', async () => {
    const input = new PassThrough();
    const passwords = prompt(input);
    input.write('senha-nova\nsenha-nova\n');

    const first = await passwords.ask('Senha: ');
    const second = await passwords.ask('Confirme a senha: ');

    expect([first, second]).toEqual(['senha-nova', 'senha-nova']);
  });

  it('no terminal, Ctrl+U limpa o que já foi digitado', async () => {
    const input = new PassThrough();
    const passwords = prompt(input, true);
    const answer = passwords.ask('Senha: ');

    input.write('senha-errada\u0015senha-certa\r');

    await expect(answer).resolves.toBe('senha-certa');
  });

  it('no terminal, guarda a confirmação colada junto com a senha', async () => {
    const input = new PassThrough();
    const passwords = prompt(input, true);
    const first = passwords.ask('Senha: ');
    input.write('senha-nova\rsenha-nova\r');
    await first;

    const second = await passwords.ask('Confirme a senha: ');

    expect(second).toBe('senha-nova');
  });

  it('no terminal, um \\r\\n partido entre dois pedaços vale um Enter só', async () => {
    const input = new PassThrough();
    const passwords = prompt(input, true);
    const first = passwords.ask('Senha: ');
    input.write('senha-nova\r');
    await first;
    const second = passwords.ask('Confirme a senha: ');

    input.write('\nsenha-nova\r');

    await expect(second).resolves.toBe('senha-nova');
  });
});
