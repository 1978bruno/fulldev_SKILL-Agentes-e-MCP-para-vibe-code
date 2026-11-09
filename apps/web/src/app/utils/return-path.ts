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
  // A normalização pode criar "//" de novo ("/a/..//site" vira "//site"): o resultado passa
  // pela mesma regra do segundo caractere.
  const path = url.pathname + url.search + url.hash;
  if (url.origin !== BASE || path.startsWith("//")) return "/";
  return path;
}

// Marca em "Entrar" que a verificação da Sessão acabou de falhar: a página mostra o formulário
// sem verificar o cookie de novo, e a nova tentativa fica para a Pessoa.
export const VERIFICATION_FAILED_PARAM = "verificacao";
const VERIFICATION_FAILED_VALUE = "falhou";

function withReturnPath(
  base: string,
  returnPath: unknown,
  extra: Record<string, string> = {},
): string {
  const params = new URLSearchParams(extra);
  const path = safeReturnPath(returnPath);
  if (path !== "/") params.set("para", path);
  const query = params.toString();
  return query ? `${base}?${query}` : base;
}

// Endereço de "Entrar" levando o caminho pedido, quando ele é seguro e não é a Home.
export function loginPath(returnPath: unknown): string {
  return withReturnPath("/entrar", returnPath);
}

// "Entrar" depois de uma verificação que falhou por rede ou servidor (o cookie fica).
export function loginPathAfterFailedVerification(returnPath: unknown): string {
  return withReturnPath("/entrar", returnPath, {
    [VERIFICATION_FAILED_PARAM]: VERIFICATION_FAILED_VALUE,
  });
}

export function isVerificationFailed(value: unknown): boolean {
  return value === VERIFICATION_FAILED_VALUE;
}

// Rota do BFF que apaga o cookie de uma Sessão recusada, levando o caminho pedido.
export function expiredSessionPath(returnPath: unknown): string {
  return withReturnPath("/api/session/expired", returnPath);
}
