import { maskEmail } from './mask-email';

describe('maskEmail', () => {
  it('mostra só a primeira letra e o domínio', () => {
    expect(maskEmail('ana.souza@empresa.com')).toBe('a***@empresa.com');
  });

  it.each([
    'a@empresa.com',
    'a***@empresa.com',
    '***@empresa.com',
    '****@empresa.com',
  ])('não devolve o endereço completo de %s', (email) => {
    const masked = maskEmail(email);

    expect(masked).not.toBe(email);
    expect(masked).toBe('(oculto)@empresa.com');
  });
});
