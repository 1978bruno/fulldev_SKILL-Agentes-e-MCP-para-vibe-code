import { OpenNavigationButton } from "@/app/components/workspace-nav/navigation-drawer";

// Cabeçalho da Conversa enquanto ela carrega: o lugar do nome, na altura do ConversationHeader.
export function ConversationHeaderSkeleton() {
  return (
    <div className="flex h-header shrink-0 items-center gap-2 border-b border-border bg-surface pr-5 pl-2 md:pl-5">
      <OpenNavigationButton />
      <span className="h-5 w-40 rounded-control bg-surface-inset motion-safe:animate-pulse" />
    </div>
  );
}
