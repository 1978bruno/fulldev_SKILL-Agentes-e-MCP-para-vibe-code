import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { ConversationHeader } from "@/app/components/conversation/conversation-header";
import { ConversationHeaderSkeleton } from "@/app/components/conversation/conversation-header-skeleton";
import { HistoryError } from "@/app/components/conversation/history-error";
import { HistoryLoading } from "@/app/components/conversation/history-loading";
import { MessageHistory } from "@/app/components/conversation/message-history";
import { RememberConversation } from "@/app/components/conversation/remember-conversation";
import {
  type Conversation,
  type CurrentPersonResult,
  getConversation,
  getCurrentPerson,
  listMessages,
  type MessagePageResult,
} from "@/app/services/chat-api";
import { readSessionToken } from "@/app/services/session-cookie";
import { readTimeZone } from "@/app/services/time-zone-cookie";
import { expiredSessionPath } from "@/app/utils/return-path";

// Uma Conversa: o cabeçalho sai assim que a Conversa é lida, e o histórico (a Pessoa e a página
// mais recente, pedidas ao mesmo tempo que a Conversa) chega depois, atrás de "Histórico
// carregando" (spec da F02, "Leituras").
export default async function ConversationPage({ params }: PageProps<"/conversas/[id]">) {
  const { id } = await params;
  const path = `/conversas/${id}`;
  const token = await readSessionToken();
  if (!token) redirect(expiredSessionPath(path));

  // As três leituras começam juntas; só a da Conversa segura o cabeçalho.
  const history = Promise.all([getCurrentPerson(token), listMessages(token, id)]);
  // Se a página sair antes de esperar o histórico, a falha dele não fica sem tratamento; quem o
  // espera recebe a mesma rejeição.
  history.catch(() => {});
  const conversationResult = await getConversation(token, id);
  if (conversationResult.kind === "unauthenticated") redirect(expiredSessionPath(path));
  if (conversationResult.kind === "not_found") notFound();
  if (conversationResult.kind !== "ok") {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <ConversationHeaderSkeleton />
        <HistoryError />
      </div>
    );
  }

  const { conversation } = conversationResult;
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <RememberConversation conversationId={conversation.id} />
      <ConversationHeader
        name={conversation.name}
        topic={conversation.topic}
        kind={conversation.kind}
      />
      <Suspense key={conversation.id} fallback={<HistoryLoading conversationName={conversation.name} />}>
        <ConversationHistory conversation={conversation} history={history} path={path} />
      </Suspense>
    </div>
  );
}

type ConversationHistoryProps = {
  conversation: Conversation;
  history: Promise<[CurrentPersonResult, MessagePageResult]>;
  path: string;
};

async function ConversationHistory({ conversation, history, path }: ConversationHistoryProps) {
  const [[personResult, pageResult], timeZone] = await Promise.all([history, readTimeZone()]);
  if (personResult.kind === "unauthenticated" || pageResult.kind === "unauthenticated") {
    redirect(expiredSessionPath(path));
  }
  if (pageResult.kind === "not_found") notFound();
  if (personResult.kind !== "ok" || pageResult.kind !== "ok") {
    return <HistoryError conversationName={conversation.name} />;
  }

  const { id: authorId, name, initials } = personResult.person;
  return (
    <MessageHistory
      conversation={conversation}
      initialPage={pageResult.page}
      timeZone={timeZone}
      renderedAt={new Date().toISOString()}
      currentPerson={{ id: authorId, name, initials }}
    />
  );
}
