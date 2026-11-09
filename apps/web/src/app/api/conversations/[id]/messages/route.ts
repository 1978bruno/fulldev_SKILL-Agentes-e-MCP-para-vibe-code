import { type NextRequest } from "next/server";
import { listMessages } from "@/app/services/chat-api";
import { readSessionToken } from "@/app/services/session-cookie";

// Páginas anteriores do histórico, lidas pelo cliente (LLD, "Cliente", "Leituras e tempo real"). A
// resposta já vem no formato da web, com as iniciais dos autores.
export async function GET(
  request: NextRequest,
  { params }: RouteContext<"/api/conversations/[id]/messages">,
) {
  const { id } = await params;
  const token = await readSessionToken();
  if (!token) return Response.json({ kind: "unauthenticated" }, { status: 401 });
  const before = request.nextUrl.searchParams.get("before") ?? undefined;
  const result = await listMessages(token, id, { before });
  switch (result.kind) {
    case "ok":
      return Response.json(result.page);
    case "unauthenticated":
      return Response.json({ kind: "unauthenticated" }, { status: 401 });
    case "not_found":
      return Response.json({ kind: "not_found" }, { status: 404 });
    default:
      return Response.json({ kind: "failure" }, { status: 502 });
  }
}
