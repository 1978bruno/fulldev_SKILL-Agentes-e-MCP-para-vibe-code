import { env } from "@/app/config/env";

// Service HTTP da API do chat, usado só no servidor (Server Actions, Server Components e
// Route Handlers). Devolve uniões de resultado em vez de lançar.

const TIMEOUT_MS = 5000;

export type Person = { id: string; name: string; email: string };

export type LoginResult =
  | { kind: "ok"; token: string; person: Person }
  | { kind: "invalid_credentials" }
  | { kind: "failure" };

export type CurrentPersonResult =
  | { kind: "ok"; person: Person }
  | { kind: "unauthenticated" }
  | { kind: "failure" };

async function request(path: string, init: RequestInit): Promise<Response | null> {
  try {
    return await fetch(new URL(path, env.CHAT_API_URL), {
      ...init,
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch {
    // Rede fora ou tempo esgotado.
    return null;
  }
}

async function errorCode(response: Response): Promise<string | undefined> {
  try {
    const body = (await response.json()) as { code?: unknown };
    return typeof body.code === "string" ? body.code : undefined;
  } catch {
    return undefined;
  }
}

// O corpo também corre contra o tempo limite e pode chegar quebrado: vira failure, sem lançar.
async function jsonBody<T>(response: Response): Promise<T | null> {
  try {
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

function sessionCookieHeader(token: string): string {
  return `${env.SESSION_COOKIE_NAME}=${token}`;
}

export async function login(email: string, password: string): Promise<LoginResult> {
  const response = await request("/v1/sessions", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!response) return { kind: "failure" };
  if (response.status === 201) {
    const body = await jsonBody<{ token: string; person: Person }>(response);
    if (!body) return { kind: "failure" };
    return { kind: "ok", token: body.token, person: body.person };
  }
  const code = response.status < 500 ? await errorCode(response) : undefined;
  // Um 400 aqui é uma entrada que passou na validação da web e a API recusou (formato ou
  // tamanho mais estritos): essas credenciais não podem estar certas.
  if (code === "invalid_credentials" || code === "validation_failed") {
    return { kind: "invalid_credentials" };
  }
  return { kind: "failure" };
}

export async function getCurrentPerson(token: string): Promise<CurrentPersonResult> {
  const response = await request("/v1/sessions/current", {
    method: "GET",
    headers: { cookie: sessionCookieHeader(token) },
  });
  if (!response) return { kind: "failure" };
  if (response.status === 200) {
    const body = await jsonBody<{ person: Person }>(response);
    if (!body) return { kind: "failure" };
    return { kind: "ok", person: body.person };
  }
  if (response.status === 401) return { kind: "unauthenticated" };
  return { kind: "failure" };
}

// Sair: apaga na API a Sessão apresentada. O resultado não muda nada para quem chama: o BFF
// apaga o cookie de qualquer jeito (spec da F01, "Menu do avatar").
export async function logout(token: string): Promise<void> {
  await request("/v1/sessions/current", {
    method: "DELETE",
    headers: { cookie: sessionCookieHeader(token) },
  });
}
