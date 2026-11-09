"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChannelIcon } from "@/app/components/conversation/channel-icon";
import type { ConversationKind } from "@/app/services/chat-api";
import { cn } from "@/app/utils/cn";

type SidebarRowProps = {
  href: string;
  name: string;
  kind: ConversationKind;
};

// Linha de Conversa da barra lateral (SidebarRow): h-7, ou 44 px abaixo de md, raio item. A da Conversa aberta fica
// ativa, com o fundo de seleção e aria-current.
export function SidebarRow({ href, name, kind }: SidebarRowProps) {
  const isActive = usePathname() === href;
  return (
    <li>
      <Link
        href={href}
        aria-current={isActive ? "page" : undefined}
        className={cn(
          "flex h-11 items-center gap-2 rounded-item px-2 text-body md:h-7",
          isActive
            ? "bg-sidebar-active text-sidebar-on-active"
            : "text-sidebar-fg hover:bg-sidebar-hover",
        )}
      >
        <ChannelIcon kind={kind} size={16} className="shrink-0" />
        <span className="truncate">{name}</span>
      </Link>
    </li>
  );
}
