import { Hash } from "lucide-react";
import Link from "next/link";

type SidebarRowProps = {
  href: string;
  name: string;
};

// Linha de Conversa da barra lateral (SidebarRow): h-7, raio item. A linha ativa entra na F02-T07.
export function SidebarRow({ href, name }: SidebarRowProps) {
  return (
    <li>
      <Link
        href={href}
        className="flex h-7 items-center gap-2 rounded-item px-2 text-body text-sidebar-fg hover:bg-sidebar-hover"
      >
        <Hash size={16} aria-hidden className="shrink-0" />
        <span className="truncate">{name}</span>
      </Link>
    </li>
  );
}
