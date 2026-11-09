import { Suspense } from "react";
import { listConversations } from "@/app/services/chat-api";
import { readSessionToken } from "@/app/services/session-cookie";
import { SidebarRow } from "./sidebar-row";
import { SidebarSection } from "./sidebar-section";

// Lista de Conversas. Na F02, só a seção "Canais"; as outras entram com as funcionalidades delas
// (F04, F05, F10). Abaixo de md ela some, para o Main não transbordar; a gaveta é da F02-T08.
export function Sidebar() {
  return (
    <aside
      aria-label="Barra lateral"
      className="hidden w-sidebar shrink-0 flex-col bg-sidebar md:flex"
    >
      <div className="flex h-header items-center justify-between border-b border-sidebar-border pl-4 pr-2">
        <p className="text-title font-black text-sidebar-fg-strong">Full Cycle</p>
      </div>
      <nav aria-label="Conversas" className="flex flex-col overflow-y-auto py-3">
        {/* O esqueleto e o erro da lista entram na F02-T07. */}
        <Suspense fallback={null}>
          <Channels />
        </Suspense>
      </nav>
    </aside>
  );
}

async function Channels() {
  const token = await readSessionToken();
  const result = token ? await listConversations(token) : null;
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
