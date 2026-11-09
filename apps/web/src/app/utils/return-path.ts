// Cabeçalho em que o proxy repassa o caminho pedido, lido pelo layout logado para o "para".
export const REQUESTED_PATH_HEADER = "x-fc-path";

// Origem fictícia só para resolver o caminho como o navegador resolveria.
const BASE = "http://chat.invalid";

// Voltar para onde ia (LLD, "Cliente", "Sessão no cliente"): só vale um caminho relativo que
// começa com "/" e cujo segundo caractere não é "/" nem "\" (o navegador trata "/\" como "//").
// O valor ainda é resolvido como URL: o parser tira tabulação e quebra de linha, e "/\t/site"
// viraria "//site"; qualquer coisa que saia da própria origem cai na Home.
export function safeReturnPath(value: unknown): string {
  if (typeof value !== "string" || !value.startsWith("/")) return "/";
  const second = value.charAt(1);
  if (second === "/" || second === "\\") return "/";
  let url: URL;
  try {
    url = new URL(value, BASE);
  } catch {
    return "/";
  }
  if (url.origin !== BASE) return "/";
  return url.pathname + url.search + url.hash;
}

function withReturnPath(base: string, returnPath: unknown): string {
  const path = safeReturnPath(returnPath);
  return path === "/" ? base : `${base}?para=${encodeURIComponent(path)}`;
}

// Endereço de "Entrar" levando o caminho pedido, quando ele é seguro e não é a Home.
export function loginPath(returnPath: unknown): string {
  return withReturnPath("/entrar", returnPath);
}

// Rota do BFF que apaga o cookie de uma Sessão recusada, levando o caminho pedido.
export function expiredSessionPath(returnPath: unknown): string {
  return withReturnPath("/api/session/expired", returnPath);
}
