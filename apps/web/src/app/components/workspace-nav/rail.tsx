import { House } from "lucide-react";
import Link from "next/link";
import { UserMenu } from "@/app/components/user/user-menu";
import type { Person } from "@/app/services/chat-api";

type RailProps = { person: Person };

// Trilho de seções, fundo chrome. Na F01: o "FC", "Início" e o avatar de iniciais.
export function Rail({ person }: RailProps) {
  return (
    <nav
      aria-label="Seções"
      className="flex w-rail shrink-0 flex-col items-center gap-2 bg-chrome px-2 py-3"
    >
      <div className="pb-2">
        <span
          aria-hidden
          className="flex size-9 items-center justify-center rounded-card bg-sidebar-fg-strong text-small font-black text-sidebar"
        >
          FC
        </span>
      </div>
      <Link
        href="/"
        aria-current="page"
        className="flex w-full flex-col items-center gap-1 rounded-card py-1 text-sidebar-fg"
      >
        <span className="flex size-9 items-center justify-center rounded-card bg-sidebar-field">
          <House size={20} aria-hidden />
        </span>
        <span className="text-caption font-bold">Início</span>
      </Link>
      <div className="flex-1" />
      <UserMenu person={person} />
    </nav>
  );
}
