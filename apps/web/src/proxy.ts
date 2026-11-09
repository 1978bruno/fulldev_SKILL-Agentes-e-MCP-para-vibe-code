import { NextResponse, type NextRequest } from "next/server";
import { env } from "@/app/config/env";
import { loginPath, REQUESTED_PATH_HEADER } from "@/app/utils/return-path";

// Confere só se o cookie de sessão existe; quem valida a Sessão é o layout logado, pela API
// do chat (LLD, "Cliente", "Sessão no cliente").
export function proxy(request: NextRequest) {
  // Sem os parâmetros internos do Next (o _rsc das navegações do cliente).
  const requested = request.nextUrl.clone();
  requested.searchParams.delete("_rsc");
  const requestedPath = requested.pathname + requested.search;
  if (!request.cookies.has(env.SESSION_COOKIE_NAME)) {
    return NextResponse.redirect(new URL(loginPath(requestedPath), request.url));
  }
  const headers = new Headers(request.headers);
  headers.set(REQUESTED_PATH_HEADER, requestedPath);
  const response = NextResponse.next({ request: { headers } });
  // Telas logadas fora do cache do navegador: voltar depois de sair não mostra o chat.
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export const config = {
  // O (?:/|$) evita que /entrar-x ou /apiario escapem do proxy por começarem igual.
  matcher: ["/((?!(?:entrar|api)(?:/|$)|_next/static|_next/image|favicon.ico).*)"],
};
