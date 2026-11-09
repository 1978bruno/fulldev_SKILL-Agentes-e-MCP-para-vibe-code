"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from "react";
import useSWRInfinite from "swr/infinite";
import type { Message, MessagePage } from "@/app/services/chat-api";
import { appendToLatestPage, flattenPages } from "@/app/utils/message-pages";
import { redirectToExpiredSession } from "@/app/utils/return-path";

type PageKey = readonly ["messages", string, string | null];

// Uma página anterior pela rota do BFF. A Sessão recusada leva a "Entrar"; a Conversa que deixou
// de existir para a Pessoa recarrega a página, que mostra "Conversa não encontrada"; outra falha
// vira erro do SWR, e o link "Carregar mensagens anteriores" tenta de novo.
async function fetchOlderPage([, conversationId, before]: PageKey): Promise<MessagePage> {
  const response = await fetch(
    `/api/conversations/${encodeURIComponent(conversationId)}/messages?before=${encodeURIComponent(before ?? "")}`,
  );
  if (response.status === 401) return redirectToExpiredSession();
  if (response.status === 404) {
    window.location.reload();
    return new Promise<never>(() => {});
  }
  if (!response.ok) throw new Error("Não foi possível carregar as mensagens anteriores.");
  return (await response.json()) as MessagePage;
}

// A página mais recente pela rota do BFF, sem `before`.
async function fetchLatestPage(conversationId: string): Promise<MessagePage> {
  const response = await fetch(`/api/conversations/${encodeURIComponent(conversationId)}/messages`);
  if (response.status === 401) return redirectToExpiredSession();
  if (!response.ok) throw new Error("Não foi possível recarregar as mensagens.");
  return (await response.json()) as MessagePage;
}

// Histórico de uma Conversa no cache do SWR (spec da F02, "Leituras"). pages[0] é a página mais
// recente, que vem do Server Component como fallbackData e nunca é buscada na API; a página
// n tem a chave da Mensagem mais antiga da página n-1 e só existe enquanto ela tem `hasMore`. Os
// eventos do tempo real (F03) entram neste mesmo cache.
export function useMessageHistory(conversationId: string, initialPage: MessagePage) {
  // A página mais recente como está agora no cache. Ao carregar uma anterior, o SWR pode pedir a
  // página 0 de novo; ela volta como está, com as Mensagens enviadas nesta abertura, e não como a
  // página inicial do servidor.
  const latestPage = useRef(initialPage);
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
    (key) => (key[2] === null ? Promise.resolve(latestPage.current) : fetchOlderPage(key)),
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
  useLayoutEffect(() => {
    latestPage.current = pages[0] ?? initialPage;
  }, [pages, initialPage]);
  const messages = useMemo(() => flattenPages(pages), [pages]);
  const hasOlder = pages.at(-1)?.hasMore ?? false;
  const isLoadingOlder = isValidating && size > pages.length;

  const loadOlder = useCallback(() => {
    if (!hasOlder || isLoadingOlder) return;
    void setSize(pages.length + 1);
  }, [hasOlder, isLoadingOlder, pages.length, setSize]);

  // As Mensagens gravadas nesta abertura. Uma carga de anteriores que começou antes de uma delas
  // entrar no cache pode terminar depois e gravar as páginas sem ela; aqui ela volta.
  const sent = useRef<Message[]>([]);

  const appendSent = useCallback(
    (message: Message) => {
      sent.current.push(message);
      void mutate((current) => appendToLatestPage(current ?? [initialPage], message), {
        revalidate: false,
      });
    },
    [mutate, initialPage],
  );

  useEffect(() => {
    const present = new Set(messages.map((message) => message.id));
    const missing = sent.current.filter((message) => !present.has(message.id));
    if (missing.length === 0) return;
    void mutate(
      (current) => missing.reduce(appendToLatestPage, current ?? [initialPage]),
      { revalidate: false },
    );
  }, [messages, mutate, initialPage]);

  // Com o reset do tempo real, o cache vira só a página mais recente, lida de novo pela rota do BFF,
  // como ao abrir a Conversa (spec da F03, "Mensagens no histórico"). Uma falha deixa o cache como
  // está.
  const reloadLatest = useCallback(async () => {
    let page: MessagePage;
    try {
      page = await fetchLatestPage(conversationId);
    } catch {
      return;
    }
    latestPage.current = page;
    await setSize(1);
    await mutate([page], { revalidate: false });
  }, [conversationId, mutate, setSize]);

  return {
    messages,
    hasOlder,
    isLoadingOlder,
    olderFailed: Boolean(error),
    loadOlder,
    // A Mensagem gravada, pelo envio ou pelo tempo real, entra no cache do mesmo jeito.
    appendSaved: appendSent,
    reloadLatest,
  };
}
