import { redirect } from "next/navigation";
import { EmptyState } from "@/app/components/ui/empty-state";
import { listConversations } from "@/app/services/chat-api";
import { readSessionToken } from "@/app/services/session-cookie";

// Home: vai para o primeiro Canal da lista; sem nenhum, "Home / Vazio". A última Conversa
// visitada, o carregamento e o erro da lista entram na F02-T06.
export default async function HomePage() {
  const token = await readSessionToken();
  const result = token ? await listConversations(token) : null;
  const first = result?.kind === "ok" ? result.conversations[0] : undefined;
  if (first) redirect(`/conversas/${first.id}`);

  return (
    <div className="flex flex-1 items-center justify-center">
      <EmptyState
        titleAs="h1"
        title="Nenhuma conversa ainda"
        description="Crie um canal ou comece uma conversa pela barra lateral."
      />
    </div>
  );
}
