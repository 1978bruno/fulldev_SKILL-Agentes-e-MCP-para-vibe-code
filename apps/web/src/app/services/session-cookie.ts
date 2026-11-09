import { cookies } from "next/headers";
import { env } from "@/app/config/env";

// Validade do cookie de sessão: 400 dias, o teto do Chrome (LLD, "Valores e configuração").
// Dura mais que a Sessão de propósito: quem decide se ela vale é a API do chat.
const SESSION_COOKIE_MAX_AGE = 400 * 24 * 60 * 60;

export async function readSessionToken(): Promise<string | undefined> {
  return (await cookies()).get(env.SESSION_COOKIE_NAME)?.value;
}

// Só em Server Functions e Route Handlers.
export async function writeSessionCookie(token: string): Promise<void> {
  (await cookies()).set(env.SESSION_COOKIE_NAME, token, {
    ...sessionCookieAttributes(),
    maxAge: SESSION_COOKIE_MAX_AGE,
  });
}

function sessionCookieAttributes() {
  return {
    httpOnly: true,
    secure: env.SESSION_COOKIE_SECURE,
    sameSite: "lax" as const,
    path: "/",
    domain: env.SESSION_COOKIE_DOMAIN,
  };
}

// Só em Server Functions e Route Handlers. Apaga com os mesmos atributos da gravação (inclusive o
// Secure): com um nome de prefixo __Secure-, o navegador recusaria um Set-Cookie sem ele.
export async function deleteSessionCookie(): Promise<void> {
  (await cookies()).set(env.SESSION_COOKIE_NAME, "", {
    ...sessionCookieAttributes(),
    maxAge: 0,
  });
}
