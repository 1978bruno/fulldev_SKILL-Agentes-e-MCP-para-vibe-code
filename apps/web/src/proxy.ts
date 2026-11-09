import { NextResponse, type NextRequest } from "next/server";
import { env } from "@/app/config/env";

// Confere só se o cookie de sessão existe; quem valida a Sessão é o layout logado, pela API
// do chat (LLD, "Cliente", "Sessão no cliente").
export function proxy(request: NextRequest) {
  if (request.cookies.has(env.SESSION_COOKIE_NAME)) {
    return NextResponse.next();
  }
  return NextResponse.redirect(new URL("/entrar", request.url));
}

export const config = {
  // O (?:/|$) evita que /entrar-x ou /apiario escapem do proxy por começarem igual.
  matcher: ["/((?!(?:entrar|api)(?:/|$)|_next/static|_next/image|favicon.ico).*)"],
};
