import { notFound, redirect } from "next/navigation";
import { ConversationHeader } from "@/app/components/conversation/conversation-header";
import { MessageHistory } from "@/app/components/conversation/message-history";
import { getConversation, listMessages } from "@/app/services/chat-api";
import { readSessionToken } from "@/app/services/session-cookie";
import { readTimeZone } from "@/app/services/time-zone-cookie";
import { expiredSessionPath } from "@/app/utils/return-path";

// Uma Conversa: o cabeçalho e a página mais recente do histórico, lidos no servidor (spec da F02,
// "Leituras"). O carregamento e o erro desta tela entram na F02-T07.
export default async function ConversationPage({ params }: PageProps<"/conversas/[id]">) {
  const { id } = await params;
  const path = `/conversas/${id}`;
  const token = await readSessionToken();
  if (!token) redirect(expiredSessionPath(path));

  const [conversationResult, pageResult] = await Promise.all([
    getConversation(token, id),
    listMessages(token, id),
  ]);
  if (conversationResult.kind === "unauthenticated" || pageResult.kind === "unauthenticated") {
    redirect(expiredSessionPath(path));
  }
  if (conversationResult.kind === "not_found" || pageResult.kind === "not_found") notFound();
  if (conversationResult.kind !== "ok" || pageResult.kind !== "ok") {
    throw new Error("Não foi possível carregar a Conversa.");
  }

  const { conversation } = conversationResult;
  const timeZone = await readTimeZone();
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <ConversationHeader name={conversation.name} topic={conversation.topic} />
      <MessageHistory
        key={conversation.id}
        conversation={conversation}
        initialPage={pageResult.page}
        timeZone={timeZone}
        renderedAt={new Date().toISOString()}
      />
    </div>
  );
}
