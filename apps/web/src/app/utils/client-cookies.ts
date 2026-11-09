// Validade dos cookies gravados pelo BFF e pelo cliente: 400 dias, o teto do Chrome (LLD,
// "Valores e configuração", "Validade do cookie de sessão").
export const COOKIE_MAX_AGE_SECONDS = 400 * 24 * 60 * 60;

// Cookies gravados pelo navegador (LLD, "Cliente", "Cookies do cliente"): sem HttpOnly e sem dado
// sensível, com Path=/, SameSite=Lax e a validade acima. Só no cliente.
export function writeClientCookie(name: string, value: string): void {
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${COOKIE_MAX_AGE_SECONDS}; SameSite=Lax`;
}

export function readClientCookie(name: string): string | undefined {
  const entry = document.cookie.split("; ").find((cookie) => cookie.startsWith(`${name}=`));
  if (!entry) return undefined;
  try {
    return decodeURIComponent(entry.slice(name.length + 1));
  } catch {
    // Valor corrompido: tratado como ausente, para o valor certo ser gravado por cima.
    return undefined;
  }
}
