"use client";

import { useCallback } from "react";
import useSWRInfinite from "swr/infinite";
import type { Message, MessagePage } from "@/app/services/chat-api";
import { appendToLatestPage, flattenPages } from "@/app/utils/message-pages";

// Histórico de uma Conversa no cache do SWR (spec da F02, "Leituras"). A primeira página vem do
// Server Component, como fallbackData, e o cache guarda só Mensagens gravadas. As páginas
// anteriores (F02-T03) e os eventos do tempo real (F03) entram neste mesmo cache.
export function useMessageHistory(conversationId: string, initialPage: MessagePage) {
  const { data, mutate } = useSWRInfinite<MessagePage>(
    (index) => (index === 0 ? ["messages", conversationId, "latest"] : null),
    // A página mais recente nunca é buscada pelo cliente: ela vem do servidor.
    () => Promise.resolve(initialPage),
    {
      fallbackData: [initialPage],
      revalidateOnMount: false,
      revalidateFirstPage: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    },
  );
  const pages = data ?? [initialPage];

  const appendSent = useCallback(
    (message: Message) => {
      void mutate((current) => appendToLatestPage(current ?? [initialPage], message), {
        revalidate: false,
      });
    },
    [mutate, initialPage],
  );

  return { messages: flattenPages(pages), appendSent };
}
