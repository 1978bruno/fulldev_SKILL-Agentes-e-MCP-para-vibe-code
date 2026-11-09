import { NextResponse, type NextRequest } from "next/server";
import { env } from "@/app/config/env";
import { loginPath, REQUESTED_PATH_HEADER } from "@/app/utils/return-path";

// Confere só se o cookie de sessão existe; quem valida a Sessão é o layout logado, pela API
// do chat (LLD, "Cliente", "Sessão no cliente").
export function proxy(request: NextRequest) {
  const requestedPath = request.nextUrl.pathname + request.nextUrl.search;
  if (!request.cookies.has(env.SESSION_COOKIE_NAME)) {
    return NextResponse.redirect(new URL(loginPath(requestedPath), request.url));
  }
  const headers = new Headers(request.headers);
  headers.set(REQUESTED_PATH_HEADER, requestedPath);
  return NextResponse.next({ request: { headers } });
}

export const config = {
  // O (?:/|$) evita que /entrar-x ou /apiario escapem do proxy por começarem igual.
  matcher: ["/((?!(?:entrar|api)(?:/|$)|_next/static|_next/image|favicon.ico).*)"],
};
