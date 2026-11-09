import { redirect } from "next/navigation";
import { ConversationListError } from "@/app/components/conversation/conversation-list-error";
import { EmptyState } from "@/app/components/ui/empty-state";
import { NarrowTopBar } from "@/app/components/workspace-nav/narrow-top-bar";
import { listConversations } from "@/app/services/chat-api";
import { readLastConversation } from "@/app/services/last-conversation-cookie";
import { readSessionToken } from "@/app/services/session-cookie";
import { expiredSessionPath } from "@/app/utils/return-path";

// Home (PRD da F02, história 2): vai para a última Conversa aberta naquele navegador, se ela está
// na lista da Pessoa; senão, para a primeira da lista; sem nenhuma, "Home / Vazio".
export default async function HomePage() {
  const token = await readSessionToken();
  if (!token) redirect(expiredSessionPath("/"));
  const [result, lastId] = await Promise.all([listConversations(token), readLastConversation()]);
  if (result.kind === "unauthenticated") redirect(expiredSessionPath("/"));
  if (result.kind === "failure") return <ConversationListError />;

  const target =
    result.conversations.find((conversation) => conversation.id === lastId) ??
    result.conversations[0];
  if (target) redirect(`/conversas/${target.id}`);

  return (
    <div className="flex flex-1 flex-col">
      <NarrowTopBar />
      <div className="flex flex-1 items-center justify-center">
        <EmptyState
          titleAs="h1"
          title="Nenhuma conversa ainda"
          description="Crie um canal ou comece uma conversa pela barra lateral."
        />
      </div>
    </div>
  );
}
