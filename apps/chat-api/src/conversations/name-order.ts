// Ordem alfabética das listas por nome (Conversas, Membros, Pessoas), na aplicação e não pela
// collation do banco: a web insere o Canal que chega pelo evento com a mesma função, numa cópia
// própria, e a lista precisa sair igual ao recarregar (spec da F04, "Conversas", "Ordem
// alfabética"). Acentos e maiúsculas ficam junto da letra base; no empate, a comparação simples
// deixa a ordem estável.
const COLLATOR = new Intl.Collator('pt-BR', { sensitivity: 'base' });

export function compareNames(a: string | null, b: string | null): number {
  const left = a ?? '';
  const right = b ?? '';
  return (
    COLLATOR.compare(left, right) || (left < right ? -1 : left > right ? 1 : 0)
  );
}
