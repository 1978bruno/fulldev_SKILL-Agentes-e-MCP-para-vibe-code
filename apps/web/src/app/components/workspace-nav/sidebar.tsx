// Lista de conversas. Na F01, só o cabeçalho do workspace; as seções entram nas
// funcionalidades que as usam (F02, F04, F05, F10).
export function Sidebar() {
  return (
    <aside
      aria-label="Barra lateral"
      className="flex w-sidebar shrink-0 flex-col bg-sidebar"
    >
      <div className="flex h-header items-center justify-between border-b border-sidebar-border pl-4 pr-2">
        <p className="text-title font-black text-sidebar-fg-strong">Full Cycle</p>
      </div>
    </aside>
  );
}
