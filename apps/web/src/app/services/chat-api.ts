import { connection } from "next/server";
import { cache } from "react";
import { env } from "@/app/config/env";
import { initials } from "@/app/utils/initials";

// Service HTTP da API do chat, usado só no servidor (Server Actions, Server Components e
// Route Handlers). Devolve uniões de resultado em vez de lançar.

const TIMEOUT_MS = 5000;

type ApiPerson = { id: string; name: string; email: string };

// As iniciais saem aqui, no servidor, e seguem prontas para os componentes do cliente
// (utils/initials.ts).
export type Person = ApiPerson & { initials: string };

function toPerson(person: ApiPerson): Person {
  return { ...person, initials: initials(person.name) };
}

export type LoginResult =
  | { kind: "ok"; token: string; person: Person }
  | { kind: "invalid_credentials" }
  | { kind: "too_many_attempts" }
  | { kind: "failure" };

export type CurrentPersonResult =
  | { kind: "ok"; person: Person }
  | { kind: "unauthenticated" }
  | { kind: "failure" };

async function request(path: string, init: RequestInit): Promise<Response | null> {
  // Chamada de tempo de requisição: o pré-render para aqui (o fetch e o tempo limite leem o
  // relógio, o que o Next recusa durante o pré-render). Fora do try: o sinal do Next que
  // interrompe o pré-render não pode virar uma "falha da API".
  await connection();
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
  const body = await jsonBody<{ code?: unknown }>(response);
  return typeof body?.code === "string" ? body.code : undefined;
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

function authenticated(token: string): HeadersInit {
  return { cookie: sessionCookieHeader(token) };
}

export async function login(email: string, password: string): Promise<LoginResult> {
  const response = await request("/v1/sessions", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!response) return { kind: "failure" };
  if (response.status === 201) {
    const body = await jsonBody<{ token: string; person: ApiPerson }>(response);
    if (!body) return { kind: "failure" };
    return { kind: "ok", token: body.token, person: toPerson(body.person) };
  }
  const code = response.status < 500 ? await errorCode(response) : undefined;
  // Um 400 aqui é uma entrada que passou na validação da web e a API recusou (formato ou
  // tamanho mais estritos): essas credenciais não podem estar certas.
  if (code === "invalid_credentials" || code === "validation_failed") {
    return { kind: "invalid_credentials" };
  }
  if (code === "too_many_login_attempts") {
    return { kind: "too_many_attempts" };
  }
  return { kind: "failure" };
}

// Leituras memorizadas por requisição (`cache` do React): componentes da mesma renderização, como
// o layout e a página, leem o mesmo resultado sem nova chamada à API.
export const getCurrentPerson = cache(fetchCurrentPerson);

async function fetchCurrentPerson(token: string): Promise<CurrentPersonResult> {
  const response = await request("/v1/sessions/current", {
    method: "GET",
    headers: authenticated(token),
  });
  if (!response) return { kind: "failure" };
  if (response.status === 200) {
    const body = await jsonBody<{ person: ApiPerson }>(response);
    if (!body) return { kind: "failure" };
    return { kind: "ok", person: toPerson(body.person) };
  }
  if (response.status === 401) return { kind: "unauthenticated" };
  return { kind: "failure" };
}

// Sair: apaga na API a Sessão apresentada. O BFF apaga o cookie de qualquer jeito (spec da F01,
// "Menu do avatar"); quando a API não confirma, a Sessão pode seguir válida no banco, e isso fica
// no log.
export async function logout(token: string): Promise<void> {
  const response = await request("/v1/sessions/current", {
    method: "DELETE",
    headers: authenticated(token),
  });
  if (response?.status !== 204 && response?.status !== 401) {
    console.warn(
      `Saída sem confirmação da API do chat (status ${response?.status ?? "sem resposta"})`,
    );
  }
}

// Conversas e Mensagens (spec da F02, "Rotas").

export type ConversationKind = "public_channel";

export type Conversation = {
  id: string;
  kind: ConversationKind;
  name: string;
  topic: string | null;
};

type ApiMessage = {
  id: string;
  conversation_id: string;
  client_id: string;
  author: { id: string; name: string };
  body: string;
  created_at: string;
};

export type MessageAuthor = { id: string; name: string; initials: string };

export type Message = {
  id: string;
  conversationId: string;
  clientId: string;
  author: MessageAuthor;
  body: string;
  createdAt: string;
};

export type MessagePage = { messages: Message[]; hasMore: boolean };

function toMessage(message: ApiMessage): Message {
  return {
    id: message.id,
    conversationId: message.conversation_id,
    clientId: message.client_id,
    author: { ...message.author, initials: initials(message.author.name) },
    body: message.body,
    createdAt: message.created_at,
  };
}

export type ConversationsResult =
  | { kind: "ok"; conversations: Conversation[] }
  | { kind: "unauthenticated" }
  | { kind: "failure" };

export type ConversationResult =
  | { kind: "ok"; conversation: Conversation }
  | { kind: "not_found" }
  | { kind: "unauthenticated" }
  | { kind: "failure" };

export type MessagePageResult =
  | { kind: "ok"; page: MessagePage }
  | { kind: "not_found" }
  | { kind: "unauthenticated" }
  | { kind: "failure" };

export type SendMessageResult =
  | { kind: "ok"; message: Message }
  | { kind: "invalid" }
  | { kind: "not_found" }
  | { kind: "unauthenticated" }
  | { kind: "failure" };

// Os casos de erro comuns às rotas de Conversa: 401 e 404 da conferência de acesso.
function commonFailure(
  response: Response | null,
): { kind: "not_found" } | { kind: "unauthenticated" } | { kind: "failure" } {
  if (response?.status === 401) return { kind: "unauthenticated" };
  if (response?.status === 404) return { kind: "not_found" };
  return { kind: "failure" };
}

function conversationPath(id: string, rest = ""): string {
  return `/v1/conversations/${encodeURIComponent(id)}${rest}`;
}

type GetResult<T> =
  | { kind: "ok"; body: T }
  | { kind: "not_found" }
  | { kind: "unauthenticated" }
  | { kind: "failure" };

// GET autenticado: 200 com o corpo, ou os casos de erro comuns às rotas de Conversa.
async function getJson<T>(token: string, path: string): Promise<GetResult<T>> {
  const response = await request(path, { method: "GET", headers: authenticated(token) });
  if (response?.status !== 200) return commonFailure(response);
  const body = await jsonBody<T>(response);
  return body ? { kind: "ok", body } : { kind: "failure" };
}

export const listConversations = cache(fetchConversations);

async function fetchConversations(token: string): Promise<ConversationsResult> {
  const result = await getJson<{ conversations: Conversation[] }>(token, "/v1/conversations");
  if (result.kind === "ok") return { kind: "ok", conversations: result.body.conversations };
  // A lista não tem 404: só a Sessão recusada ou a falha.
  return result.kind === "unauthenticated" ? result : { kind: "failure" };
}

export async function getConversation(
  token: string,
  id: string,
): Promise<ConversationResult> {
  const result = await getJson<{ conversation: Conversation }>(token, conversationPath(id));
  return result.kind === "ok" ? { kind: "ok", conversation: result.body.conversation } : result;
}

// Uma página do histórico: as anteriores a `before`, ou as mais recentes sem ele.
export async function listMessages(
  token: string,
  conversationId: string,
  { before }: { before?: string } = {},
): Promise<MessagePageResult> {
  const query = before ? `?before=${encodeURIComponent(before)}` : "";
  const result = await getJson<{ messages: ApiMessage[]; has_more: boolean }>(
    token,
    conversationPath(conversationId, `/messages${query}`),
  );
  if (result.kind !== "ok") return result;
  return {
    kind: "ok",
    page: { messages: result.body.messages.map(toMessage), hasMore: result.body.has_more },
  };
}

export async function sendMessage(
  token: string,
  conversationId: string,
  message: { clientId: string; body: string },
): Promise<SendMessageResult> {
  const response = await request(conversationPath(conversationId, "/messages"), {
    method: "POST",
    headers: { ...authenticated(token), "content-type": "application/json" },
    body: JSON.stringify({ client_id: message.clientId, body: message.body }),
  });
  if (response?.status === 201) {
    const body = await jsonBody<{ message: ApiMessage }>(response);
    if (body) return { kind: "ok", message: toMessage(body.message) };
    return { kind: "failure" };
  }
  if (response?.status === 400) return { kind: "invalid" };
  return commonFailure(response);
}
