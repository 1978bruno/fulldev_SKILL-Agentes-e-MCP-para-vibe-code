import { ChevronDown } from "lucide-react";

type SidebarSectionProps = {
  title: string;
  children: React.ReactNode;
};

// Seção da barra lateral: o cabeçalho e a lista. Recolher e expandir entram na F02-T07.
export function SidebarSection({ title, children }: SidebarSectionProps) {
  return (
    <section aria-label={title} className="flex flex-col px-2 pb-4">
      <h2 className="flex h-7 items-center gap-2 rounded-item px-2 text-small font-bold text-sidebar-fg">
        <ChevronDown size={16} aria-hidden />
        {title}
      </h2>
      <ul className="flex flex-col gap-px pt-1">{children}</ul>
    </section>
  );
}
