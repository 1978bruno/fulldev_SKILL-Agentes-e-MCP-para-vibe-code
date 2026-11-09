"use client";

import { useEffect } from "react";
import useSWR from "swr";
import { useRealtime } from "@/app/components/realtime/realtime-provider";
import type { Conversation } from "@/app/services/chat-api";
import { applyMemberAdded } from "@/app/utils/conversation-list";
import { redirectToExpiredSession } from "@/app/utils/return-path";
import { AddChannelAction } from "./add-channel-action";
import { SidebarRow } from "./sidebar-row";
import { SidebarSection } from "./sidebar-section";

// Chave do cache da lista de Conversas, a rota do BFF que a lê de novo.
export const CONVERSATIONS_KEY = "/api/conversations";

async function fetchConversations(): Promise<readonly Conversation[]> {
  const response = await fetch(CONVERSATIONS_KEY);
  if (response.status === 401) return redirectToExpiredSession();
  if (!response.ok) throw new Error("Não foi possível carregar as conversas.");
  return (await response.json()) as Conversation[];
}

type ChannelListProps = {
  // A lista lida pelo Server Component, ponto de partida do cache.
  initialConversations: readonly Conversation[];
  // A Pessoa da Sessão: o evento põe a Conversa na lista só de quem acabou de entrar nela.
  personId: string;
};

// A seção "Canais" no cliente (spec da F04, "Lista de Conversas no cliente"): o
// conversation.member_added muda o cache sem nova requisição, e o reset do tempo real busca a
// lista de novo. Uma falha nessa busca mantém a lista que já está na tela.
export function ChannelList({ initialConversations, personId }: ChannelListProps) {
  // A chave leva a Pessoa: quem entra depois de outra na mesma aba, sem recarregar a página, não
  // herda a lista dela.
  const { data: conversations, mutate } = useSWR([CONVERSATIONS_KEY, personId], fetchConversations, {
    fallbackData: initialConversations,
    revalidateOnMount: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  });
  const { subscribe } = useRealtime();

  // Uma lista nova do servidor (a revalidação do layout depois de criar um Canal) vale mais que a
  // do cache, que o fallbackData não substitui depois do primeiro mutate.
  useEffect(() => {
    void mutate(initialConversations, { revalidate: false });
  }, [initialConversations, mutate]);

  useEffect(
    () =>
      subscribe({
        onMemberAdded: ({ conversation, personIds }) => {
          void mutate(
            (current) =>
              applyMemberAdded(current ?? initialConversations, conversation, personIds, personId),
            { revalidate: false },
          );
        },
        onSync: (event) => {
          if (event.reset) void mutate();
        },
      }),
    [subscribe, mutate, initialConversations, personId],
  );

  return (
    <SidebarSection title="Canais">
      {conversations.map((conversation) => (
        <SidebarRow
          key={conversation.id}
          href={`/conversas/${conversation.id}`}
          name={conversation.name}
          kind={conversation.kind}
        />
      ))}
      <AddChannelAction />
    </SidebarSection>
  );
}
