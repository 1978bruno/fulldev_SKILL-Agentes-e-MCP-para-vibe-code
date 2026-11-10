import { OpenNavigationButton } from "@/app/components/workspace-nav/navigation-drawer";
import type { ConversationKind } from "@/app/services/chat-api";
import { ChannelIcon } from "./channel-icon";

type ConversationHeaderProps = {
  name: string;
  topic: string | null;
  kind: ConversationKind;
  // O botão de Membros, que a página põe quando tem a Conversa inteira.
  members?: React.ReactNode;
};

// Cabeçalho da Conversa (ConversationHeader): h-header; o Tópico some abaixo de 640 px, e o botão
// da gaveta (Menu) só aparece abaixo de 768 px.
export function ConversationHeader({ name, topic, kind, members }: ConversationHeaderProps) {
  return (
    <header className="flex h-header shrink-0 items-center gap-2 border-b border-border bg-surface pr-5 pl-2 md:pl-5">
      <OpenNavigationButton />
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <h1 className="flex shrink-0 items-center gap-1 text-title font-black text-fg">
          <ChannelIcon kind={kind} size={16} />
          {name}
        </h1>
        {topic && (
          <p className="hidden min-w-0 flex-1 truncate text-small text-fg-muted sm:block">
            {topic}
          </p>
        )}
      </div>
      {members}
    </header>
  );
}
