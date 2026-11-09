import type { Page } from "@playwright/test";

// Mesmo nome do compose.yaml (SESSION_COOKIE_NAME do web).
export const SESSION_COOKIE_NAME = "fc_session";

export function sessionCookie(token: string, baseURL: string) {
  return {
    name: SESSION_COOKIE_NAME,
    value: token,
    url: baseURL,
    httpOnly: true,
    sameSite: "Lax" as const,
  };
}

// Cookie da última Conversa, com o mesmo nome do web (utils/last-conversation.ts).
export const LAST_CONVERSATION_COOKIE = "fc_last_conversation";

export function lastConversationCookie(conversationId: string, baseURL: string) {
  return { name: LAST_CONVERSATION_COOKIE, value: conversationId, url: baseURL };
}

// Um cookie do navegador da página, pelo nome.
export async function browserCookie(page: Page, name: string) {
  return (await page.context().cookies()).find((cookie) => cookie.name === name);
}
