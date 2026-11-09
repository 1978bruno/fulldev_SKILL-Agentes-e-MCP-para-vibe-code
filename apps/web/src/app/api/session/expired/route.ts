import { type NextRequest } from "next/server";
import { getCurrentPerson } from "@/app/services/chat-api";
import {
  deleteSessionCookie,
  readSessionToken,
} from "@/app/services/session-cookie";
import { loginPath, safeReturnPath } from "@/app/utils/return-path";

// O layout logado manda para cá quando a API recusa a Sessão, porque um Server Component não
// apaga cookie. A Sessão é conferida de novo antes de apagar, para um link de outro site não
// derrubar um cookie válido.
export async function GET(request: NextRequest) {
  const returnPath = request.nextUrl.searchParams.get("para");
  const token = await readSessionToken();
  const result = token ? await getCurrentPerson(token) : null;
  if (result?.kind === "ok") {
    return redirectTo(safeReturnPath(returnPath));
  }
  await deleteSessionCookie();
  return redirectTo(loginPath(returnPath));
}

// Location relativo: o request.url do Route Handler traz o host em que o servidor escuta
// (0.0.0.0 no contêiner), e não o que o navegador usou.
function redirectTo(path: string): Response {
  return new Response(null, { status: 307, headers: { Location: path } });
}
