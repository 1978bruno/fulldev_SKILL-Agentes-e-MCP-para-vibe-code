// Esqueleto de uma Mensagem (MessageSkeleton): o lugar do avatar, do nome e de uma linha de texto.
export function MessageSkeleton({ width }: { width: string }) {
  return (
    <div className="flex gap-2 px-5 py-1">
      <span className="size-9 shrink-0 rounded-item bg-surface-inset" />
      <div className="flex min-w-0 flex-1 flex-col gap-2 pt-1">
        <span className="h-3 w-28 rounded-control bg-surface-inset" />
        <span className="h-3 rounded-control bg-surface-inset" style={{ width }} />
      </div>
    </div>
  );
}

const WIDTHS = ["70%", "45%", "92%", "58%", "77%", "38%"];

// Pilha de esqueletos alinhada ao fim da área, onde as Mensagens mais recentes vão aparecer.
export function MessageSkeletonList() {
  return (
    <div aria-hidden className="flex flex-1 flex-col justify-end gap-2 pb-4 motion-safe:animate-pulse">
      {WIDTHS.map((width) => (
        <MessageSkeleton key={width} width={width} />
      ))}
    </div>
  );
}
