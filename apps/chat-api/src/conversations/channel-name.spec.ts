import { parseChannelName, parseTopic } from './channel-name';

describe('parseChannelName', () => {
  it.each([
    ['geral', 'geral'],
    ['anúncios', 'anúncios'],
    ['time-de-produto', 'time-de-produto'],
    ['release_2026', 'release_2026'],
    ['a', 'a'],
    ['  geral  ', 'geral'],
    ['a'.repeat(80), 'a'.repeat(80)],
  ])('aceita %p', (raw, name) => {
    expect(parseChannelName(raw)).toEqual({ ok: true, value: name });
  });

  it('normaliza o nome para NFC', () => {
    const decomposed = 'anúncios';

    expect(parseChannelName(decomposed)).toEqual({
      ok: true,
      value: 'anúncios',
    });
  });

  it.each([
    ['vazio', ''],
    ['só espaços', '   '],
    ['acima de 80 caracteres', 'a'.repeat(81)],
    ['com maiúsculas', 'Geral'],
    ['com espaço no meio', 'time de produto'],
    ['com #', '#geral'],
    ['com pontuação', 'geral!'],
    ['com barra', 'time/produto'],
  ])('recusa um nome %s', (_caso, raw) => {
    expect(parseChannelName(raw)).toMatchObject({ ok: false });
  });
});

describe('parseTopic', () => {
  it('aceita um Tópico de até 250 caracteres e remove as pontas', () => {
    expect(parseTopic('  Conversas do time  ')).toEqual({
      ok: true,
      value: 'Conversas do time',
    });
    expect(parseTopic('é'.repeat(250))).toEqual({
      ok: true,
      value: 'é'.repeat(250),
    });
  });

  it.each([undefined, '', '   '])('trata %p como Canal sem Tópico', (raw) => {
    expect(parseTopic(raw)).toEqual({ ok: true, value: null });
  });

  it.each([
    ['acima de 250 caracteres', 'a'.repeat(251)],
    ['com quebra de linha', 'linha um\nlinha dois'],
    ['com retorno de carro', 'linha um\rlinha dois'],
  ])('recusa um Tópico %s', (_caso, raw) => {
    expect(parseTopic(raw)).toMatchObject({ ok: false });
  });
});
