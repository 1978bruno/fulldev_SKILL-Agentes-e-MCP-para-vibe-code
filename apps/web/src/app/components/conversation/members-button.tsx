"use client";

import { Users } from "lucide-react";
import { useState } from "react";
import useSWR from "swr";
import { Dialog, DialogTrigger } from "@/app/components/ui/dialog";
import { CONVERSATIONS_KEY } from "@/app/components/workspace-nav/channel-list";
import type { Conversation, ConversationKind } from "@/app/services/chat-api";
import { MembersDialog } from "./members-dialog";

type MembersButtonProps = {
  conversation: { id: string; name: string; kind: ConversationKind; memberCount: number };
  personId: string;
};

// O botão de Membros do ConversationHeader: a quantidade vem da lista de Conversas no cliente, que o
// tempo real atualiza, com a Conversa do servidor como ponto de partida (spec da F04, "Cabeçalho do
// Canal"). Abre "Membros de #nome".
export function MembersButton({ conversation, personId }: MembersButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  // Sem fetcher: só lê o cache que a barra lateral mantém.
  const { data: conversations } = useSWR<readonly Conversation[]>(
    [CONVERSATIONS_KEY, personId],
    null,
  );
  const memberCount =
    conversations?.find((item) => item.id === conversation.id)?.memberCount ??
    conversation.memberCount;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          aria-label={`Membros: ${memberCount}`}
          className="flex h-7 shrink-0 items-center gap-1 rounded-control border border-border px-2 text-small font-bold text-fg-muted hover:bg-surface-subtle"
        >
          <Users size={16} aria-hidden />
          <span aria-hidden>{memberCount}</span>
        </button>
      </DialogTrigger>
      {isOpen && <MembersDialog conversation={conversation} personId={personId} />}
    </Dialog>
  );
}
