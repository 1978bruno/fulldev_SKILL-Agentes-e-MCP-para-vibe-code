import { compareNames } from './name-order';

describe('compareNames', () => {
  it('põe acentos e maiúsculas junto da letra base', () => {
    const names = ['zebra', 'Ábaco', 'b', 'árvore', 'abelha', 'Bruno'];

    const sorted = [...names].sort(compareNames);

    expect(sorted).toEqual([
      'Ábaco',
      'abelha',
      'árvore',
      'b',
      'Bruno',
      'zebra',
    ]);
  });

  it('põe a pontuação antes das letras', () => {
    const names = ['zebra', '_meio', 'abelha', '-traço'];

    const sorted = [...names].sort(compareNames);

    expect(sorted).toEqual(['_meio', '-traço', 'abelha', 'zebra']);
  });

  it('desempata nomes iguais na comparação de base pela comparação simples', () => {
    const sorted = ['ana', 'Ana', 'ána'].sort(compareNames);

    expect(sorted).toEqual(['Ana', 'ana', 'ána']);
  });

  it('trata o nome ausente como vazio, antes dos outros', () => {
    expect(compareNames(null, 'a')).toBeLessThan(0);
    expect(compareNames('a', null)).toBeGreaterThan(0);
    expect(compareNames(null, null)).toBe(0);
  });
});
