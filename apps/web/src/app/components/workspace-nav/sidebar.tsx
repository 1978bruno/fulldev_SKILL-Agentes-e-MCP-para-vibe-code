import { Suspense } from "react";
import { listConversations } from "@/app/services/chat-api";
import { readSessionToken } from "@/app/services/session-cookie";
import { SidebarError } from "./sidebar-error";
import { SidebarRow } from "./sidebar-row";
import { SidebarSection } from "./sidebar-section";
import { SidebarSkeleton } from "./sidebar-skeleton";

// Lista de Conversas. Na F02, só a seção "Canais"; as outras entram com as funcionalidades delas
// (F04, F05, F10). Abaixo de md ela fica na gaveta, com o Rail (NavigationDrawer).
export function Sidebar() {
  return (
    <aside
      aria-label="Barra lateral"
      className="flex w-sidebar shrink-0 flex-col bg-sidebar"
    >
      <div className="flex h-header items-center justify-between border-b border-sidebar-border pl-4 pr-2">
        <p className="text-title font-black text-sidebar-fg-strong">Full Cycle</p>
      </div>
      <nav aria-label="Conversas" className="flex flex-col overflow-y-auto py-3">
        <Suspense fallback={<SidebarSkeleton />}>
          <Channels />
        </Suspense>
      </nav>
    </aside>
  );
}

async function Channels() {
  const token = await readSessionToken();
  const result = token ? await listConversations(token) : null;
  // Sem Sessão, o layout já leva a Pessoa para "Entrar"; aqui a lista só fica vazia.
  if (result?.kind === "failure") return <SidebarError />;
  const conversations = result?.kind === "ok" ? result.conversations : [];
  return (
    <SidebarSection title="Canais">
      {conversations.map((conversation) => (
        <SidebarRow
          key={conversation.id}
          href={`/conversas/${conversation.id}`}
          name={conversation.name}
        />
      ))}
    </SidebarSection>
  );
}
