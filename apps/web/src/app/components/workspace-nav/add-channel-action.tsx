"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogTrigger } from "@/app/components/ui/dialog";
import { CreateChannelDialog } from "./create-channel-dialog";

// SidebarAction "Adicionar canal", no fim da seção "Canais" (Casca / Sidebar / Com dados): abre o
// diálogo "Criar canal". O conteúdo monta a cada abertura, com o formulário vazio.
export function AddChannelAction() {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <li>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <button
            type="button"
            className="flex h-11 w-full items-center gap-2 rounded-item px-2 text-body text-sidebar-fg hover:bg-sidebar-hover md:h-7"
          >
            <span
              aria-hidden
              className="flex size-4 shrink-0 items-center justify-center rounded-control bg-sidebar-field"
            >
              <Plus size={12} />
            </span>
            Adicionar canal
          </button>
        </DialogTrigger>
        {isOpen && <CreateChannelDialog onCreated={() => setIsOpen(false)} />}
      </Dialog>
    </li>
  );
}
