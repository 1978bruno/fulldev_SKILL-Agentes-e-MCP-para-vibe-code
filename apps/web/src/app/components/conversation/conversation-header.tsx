import { Hash } from "lucide-react";
import { OpenNavigationButton } from "@/app/components/workspace-nav/navigation-drawer";

type ConversationHeaderProps = {
  name: string;
  topic: string | null;
};

// Cabeçalho da Conversa (ConversationHeader): h-header; o Tópico some abaixo de 640 px, e o botão
// da gaveta (Menu) só aparece abaixo de 768 px.
export function ConversationHeader({ name, topic }: ConversationHeaderProps) {
  return (
    <header className="flex h-header shrink-0 items-center gap-2 border-b border-border bg-surface pr-5 pl-2 md:pl-5">
      <OpenNavigationButton />
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <h1 className="flex shrink-0 items-center gap-1 text-title font-black text-fg">
          <Hash size={16} aria-hidden />
          {name}
        </h1>
        {topic && (
          <p className="hidden min-w-0 flex-1 truncate text-small text-fg-muted sm:block">
            {topic}
          </p>
        )}
      </div>
    </header>
  );
}
