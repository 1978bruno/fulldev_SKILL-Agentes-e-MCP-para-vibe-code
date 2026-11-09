"use client";

import { useCallback, useMemo } from "react";
import useSWRInfinite from "swr/infinite";
import type { Message, MessagePage } from "@/app/services/chat-api";
import { appendToLatestPage, flattenPages } from "@/app/utils/message-pages";
import { expiredSessionPath } from "@/app/utils/return-path";

type PageKey = readonly ["messages", string, string | null];

// Uma página anterior pela rota do BFF. A Sessão recusada leva a "Entrar"; outra falha vira erro
// do SWR, e o link "Carregar mensagens anteriores" tenta de novo.
async function fetchOlderPage([, conversationId, before]: PageKey): Promise<MessagePage> {
  const response = await fetch(
    `/api/conversations/${encodeURIComponent(conversationId)}/messages?before=${encodeURIComponent(before ?? "")}`,
  );
  if (response.status === 401) {
    window.location.assign(expiredSessionPath(window.location.pathname));
  }
  if (!response.ok) throw new Error("Não foi possível carregar as mensagens anteriores.");
  return (await response.json()) as MessagePage;
}

// Histórico de uma Conversa no cache do SWR (spec da F02, "Leituras"). pages[0] é a página mais
// recente, que vem do Server Component como fallbackData e nunca é buscada pelo cliente; a página
// n tem a chave da Mensagem mais antiga da página n-1 e só existe enquanto ela tem `hasMore`. Os
// eventos do tempo real (F03) entram neste mesmo cache.
export function useMessageHistory(conversationId: string, initialPage: MessagePage) {
  const { data, mutate, size, setSize, error, isValidating } = useSWRInfinite<
    MessagePage,
    Error,
    (index: number, previous: MessagePage | null) => PageKey | null
  >(
    (index, previous) => {
      if (index === 0) return ["messages", conversationId, null];
      const oldest = previous?.messages[0];
      return previous?.hasMore && oldest ? ["messages", conversationId, oldest.id] : null;
    },
    (key) => (key[2] === null ? Promise.resolve(initialPage) : fetchOlderPage(key)),
    {
      fallbackData: [initialPage],
      revalidateOnMount: false,
      revalidateFirstPage: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      shouldRetryOnError: false,
    },
  );
  const pages = useMemo(() => data ?? [initialPage], [data, initialPage]);
  const messages = useMemo(() => flattenPages(pages), [pages]);
  const hasOlder = pages.at(-1)?.hasMore ?? false;
  const isLoadingOlder = isValidating && size > pages.length;

  const loadOlder = useCallback(() => {
    if (!hasOlder || isLoadingOlder) return;
    void setSize(pages.length + 1);
  }, [hasOlder, isLoadingOlder, pages.length, setSize]);

  const appendSent = useCallback(
    (message: Message) => {
      void mutate((current) => appendToLatestPage(current ?? [initialPage], message), {
        revalidate: false,
      });
    },
    [mutate, initialPage],
  );

  return {
    messages,
    hasOlder,
    isLoadingOlder,
    olderFailed: Boolean(error) && !isLoadingOlder,
    loadOlder,
    appendSent,
  };
}
