// Cabeçalho em que o proxy repassa o caminho pedido, lido pelo layout logado para o "para".
export const REQUESTED_PATH_HEADER = "x-fc-path";

// Voltar para onde ia (LLD, "Cliente", "Sessão no cliente"): só vale um caminho relativo que
// começa com "/" e cujo segundo caractere não é "/" nem "\" (o navegador trata "/\" como "//").
export function safeReturnPath(value: unknown): string {
  if (typeof value !== "string" || !value.startsWith("/")) return "/";
  const second = value.charAt(1);
  if (second === "/" || second === "\\") return "/";
  return value;
}

// Endereço de "Entrar" levando o caminho pedido, quando ele é seguro e não é a Home.
export function loginPath(returnPath: unknown): string {
  const path = safeReturnPath(returnPath);
  return path === "/" ? "/entrar" : `/entrar?para=${encodeURIComponent(path)}`;
}

// Rota do BFF que apaga o cookie de uma Sessão recusada, levando o caminho pedido.
export function expiredSessionPath(returnPath: unknown): string {
  const path = safeReturnPath(returnPath);
  return path === "/"
    ? "/api/session/expired"
    : `/api/session/expired?para=${encodeURIComponent(path)}`;
}
