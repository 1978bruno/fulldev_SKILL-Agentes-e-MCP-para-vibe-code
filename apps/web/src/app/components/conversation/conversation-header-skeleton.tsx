// Cabeçalho da Conversa enquanto ela carrega: o lugar do nome, na altura do ConversationHeader.
export function ConversationHeaderSkeleton() {
  return (
    <div className="flex h-header shrink-0 items-center border-b border-border bg-surface px-5">
      <span className="h-5 w-40 rounded-control bg-surface-inset motion-safe:animate-pulse" />
    </div>
  );
}
