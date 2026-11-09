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
