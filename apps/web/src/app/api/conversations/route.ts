import { listConversations } from "@/app/services/chat-api";
import { readSessionToken } from "@/app/services/session-cookie";

// A lista de Conversas da barra lateral, lida pelo cliente no reset do tempo real (spec da F04,
// "BFF", "Rotas de leitura").
export async function GET() {
  const token = await readSessionToken();
  const result = token ? await listConversations(token) : ({ kind: "unauthenticated" } as const);
  if (result.kind === "ok") return Response.json(result.conversations);
  return Response.json({ kind: result.kind }, { status: ERROR_STATUS[result.kind] });
}

const ERROR_STATUS = { unauthenticated: 401, failure: 502 } as const;
