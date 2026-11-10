"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import { useRealtime } from "@/app/components/realtime/realtime-provider";
import { Button } from "@/app/components/ui/button";
import { DialogBody, DialogContent, DialogFooter } from "@/app/components/ui/dialog";
import { PersonRow } from "@/app/components/user/person-row";
import type { ConversationKind, PersonSummary } from "@/app/services/chat-api";
import { redirectToExpiredSession } from "@/app/utils/return-path";
import { AddPeopleStep } from "./add-people-step";

async function fetchMembers(url: string): Promise<PersonSummary[]> {
  const response = await fetch(url);
  if (response.status === 401) return redirectToExpiredSession();
  if (!response.ok) throw new Error("Não foi possível carregar os Membros.");
  return (await response.json()) as PersonSummary[];
}

type MembersDialogProps = {
  conversation: { id: string; name: string; kind: ConversationKind };
  personId: string;
};

// "Membros de #nome" ("Conversa / Sobreposições / Membros do canal"): lida ao abrir e de novo a
// cada conversation.member_added da Conversa enquanto está aberta. No Canal privado, "Adicionar
// pessoas" troca o conteúdo pelo passo da criação, e adicionar ou voltar mostra a lista de novo
// (spec da F04, "Lista de Membros").
export function MembersDialog({ conversation, personId }: MembersDialogProps) {
  const [view, setView] = useState<"list" | "add">("list");
  const membersKey = `/api/conversations/${encodeURIComponent(conversation.id)}/members`;
  const { data: members, error, mutate } = useSWR(membersKey, fetchMembers, {
    revalidateOnFocus: false,
  });
  const { subscribe } = useRealtime();

  useEffect(
    () =>
      subscribe({
        onMemberAdded: (event) => {
          if (event.conversation.id === conversation.id) void mutate();
        },
      }),
    [subscribe, mutate, conversation.id],
  );

  if (view === "add") {
    return (
      <AddPeopleStep
        conversation={conversation}
        onDone={() => {
          void mutate();
          setView("list");
        }}
        secondary={{ label: "Voltar", onClick: () => setView("list") }}
      />
    );
  }

  return (
    <DialogContent title={`Membros de #${conversation.name}`}>
      <DialogBody>
        {error && !members && (
          <p role="alert" className="text-small text-danger-fg">
            Não foi possível carregar os membros.
          </p>
        )}
        {members && (
          <ul aria-label="Membros" className="flex max-h-96 flex-col overflow-y-auto">
            {members.map((member) => (
              <li key={member.id} className="flex items-center p-2">
                <PersonRow person={member} isSelf={member.id === personId} />
              </li>
            ))}
          </ul>
        )}
      </DialogBody>
      {conversation.kind === "private_channel" && (
        <DialogFooter>
          <Button type="button" onClick={() => setView("add")}>
            Adicionar pessoas
          </Button>
        </DialogFooter>
      )}
    </DialogContent>
  );
}
