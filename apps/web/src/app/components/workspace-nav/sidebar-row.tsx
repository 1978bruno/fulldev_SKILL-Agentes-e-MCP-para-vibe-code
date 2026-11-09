"use client";

import { Hash } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/app/utils/cn";

type SidebarRowProps = {
  href: string;
  name: string;
};

// Linha de Conversa da barra lateral (SidebarRow): h-7, ou 44 px abaixo de md, raio item. A da Conversa aberta fica
// ativa, com o fundo de seleção e aria-current.
export function SidebarRow({ href, name }: SidebarRowProps) {
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
        <Hash size={16} aria-hidden className="shrink-0" />
        <span className="truncate">{name}</span>
      </Link>
    </li>
  );
}
