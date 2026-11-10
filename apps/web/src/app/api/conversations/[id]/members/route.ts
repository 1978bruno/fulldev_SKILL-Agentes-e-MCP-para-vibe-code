import { listMembers } from "@/app/services/chat-api";
import { readSessionToken } from "@/app/services/session-cookie";

// Os Membros de uma Conversa, lidos pelo cliente na lista de Membros (spec da F04, "BFF"). A
// resposta já vem no formato da web, com as iniciais.
export async function GET(_request: Request, { params }: RouteContext<"/api/conversations/[id]/members">) {
  const { id } = await params;
  const token = await readSessionToken();
  const result = token ? await listMembers(token, id) : ({ kind: "unauthenticated" } as const);
  if (result.kind === "ok") return Response.json(result.members);
  return Response.json({ kind: result.kind }, { status: ERROR_STATUS[result.kind] });
}

const ERROR_STATUS = { unauthenticated: 401, not_found: 404, failure: 502 } as const;
