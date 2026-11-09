import { maskEmail } from './mask-email';

describe('maskEmail', () => {
  it('mostra só a primeira letra e o domínio', () => {
    expect(maskEmail('ana.souza@empresa.com')).toBe('a***@empresa.com');
  });

  it('esconde a parte local inteira quando ela tem uma letra só', () => {
    expect(maskEmail('a@empresa.com')).toBe('***@empresa.com');
  });
});
