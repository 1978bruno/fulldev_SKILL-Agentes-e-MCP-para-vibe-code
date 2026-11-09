import { parseCookie } from 'cookie';

export function readSessionCookie(
  cookieHeader: string | undefined,
  cookieName: string,
): string | undefined {
  if (!cookieHeader) return undefined;
  return parseCookie(cookieHeader)[cookieName] || undefined;
}
