// Cópia, na web, da ordem alfabética da API do chat (spec da F04, "Conversas", "Ordem
// alfabética"): a lista que o cliente monta sai igual à que a API devolve ao recarregar. Acentos e
// maiúsculas ficam junto da letra base; no empate, a comparação simples deixa a ordem estável.
const COLLATOR = new Intl.Collator("pt-BR", { sensitivity: "base" });

export function compareNames(a: string | null, b: string | null): number {
  const left = a ?? "";
  const right = b ?? "";
  return COLLATOR.compare(left, right) || (left < right ? -1 : left > right ? 1 : 0);
}
