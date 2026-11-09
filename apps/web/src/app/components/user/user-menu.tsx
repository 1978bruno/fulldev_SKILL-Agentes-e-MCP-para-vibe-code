"use client";

import { LogOut } from "lucide-react";
import { useTransition } from "react";
import { logout } from "@/app/actions/logout";
import { Avatar } from "@/app/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
import type { Person } from "@/app/services/chat-api";

type UserMenuProps = { person: Person };

// Menu do avatar do Rail. Na F01: o cabeçalho, sem a linha de presença, e "Sair do Full Cycle".
export function UserMenu({ person }: UserMenuProps) {
  const [isPending, startTransition] = useTransition();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="rounded-item">
        <Avatar name={person.name} seed={person.id} />
        <span className="sr-only">Menu de {person.name}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="right" align="end" className="w-72">
        <div className="flex items-center gap-3 px-4 pt-1 pb-2">
          <Avatar name={person.name} seed={person.id} />
          <p className="min-w-0 flex-1 truncate text-body font-black text-fg">
            {person.name}
          </p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled={isPending}
          onSelect={() => startTransition(() => logout())}
        >
          <LogOut size={16} aria-hidden />
          Sair do Full Cycle
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
