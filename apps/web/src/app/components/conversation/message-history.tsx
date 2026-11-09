"use client";

import { useEffect, useEffectEvent, useLayoutEffect, useMemo, useRef, useState } from "react";
import { SWRConfig } from "swr";
import { MessageItem } from "@/app/components/message/message-item";
import { buttonVariants } from "@/app/components/ui/button";
import { Spinner } from "@/app/components/ui/spinner";
import { useMessageHistory } from "@/app/hooks/use-message-history";
import { useRealtimeMessages } from "@/app/hooks/use-realtime-messages";
import {
  type PendingMessage,
  type PendingStatus,
  usePendingMessages,
} from "@/app/hooks/use-pending-messages";
import type {
  Conversation,
  Message,
  MessageAuthor,
  MessagePage,
} from "@/app/services/chat-api";
import { dayKey, labelForDay } from "@/app/utils/day-label";
import { isCompact } from "@/app/utils/message-grouping";
import { ConversationIntro } from "./conversation-intro";
import { MessageComposer } from "./message-composer";
import { NewMessagesPill } from "./new-messages-pill";

type MessageHistoryProps = {
  conversation: Conversation;
  initialPage: MessagePage;
  // Fuso das horas e dos dias, e o instante da renderização no servidor, que é o "agora" de
  // "Hoje" e "Ontem" dos dois lados, para a hidratação não divergir.
  timeZone: string;
  renderedAt: string;
  // A Pessoa da Sessão, autora das Mensagens que ainda estão sendo enviadas.
  currentPerson: MessageAuthor;
};

// Distância do topo em que o sentinela pede a página anterior (spec da F02, "Lista de Mensagens").
const LOAD_OLDER_MARGIN_PX = 300;

// Distância do fim da lista até a qual a Pessoa está "no fim" (LLD, "Valores e configuração").
const END_OF_LIST_PX = 100;

// Lista de Mensagens e caixa de mensagem de uma Conversa. O cache do SWR é desta montagem: abrir
// a Conversa de novo começa da página que o servidor acabou de ler.
export function MessageHistory(props: MessageHistoryProps) {
  return (
    <SWRConfig value={{ provider: () => new Map() }}>
      <History {...props} />
    </SWRConfig>
  );
}

function History({
  conversation,
  initialPage,
  timeZone,
  renderedAt,
  currentPerson,
}: MessageHistoryProps) {
  const { messages: saved, hasOlder, isLoadingOlder, olderFailed, loadOlder, appendSaved, reloadLatest } =
    useMessageHistory(conversation.id, initialPage);
  const { pending, send, retry, discard, dropDelivered } = usePendingMessages(
    conversation.id,
    currentPerson,
    appendSaved,
  );
  const { isSynced } = useRealtimeMessages(conversation.id, initialPage, {
    currentPersonId: currentPerson.id,
    appendSaved,
    dropDelivered,
    reloadLatest,
  });
  // As pendentes vêm sempre depois das gravadas, e passam pelo mesmo agrupamento.
  const messages = useMemo<(Message & { status?: PendingStatus })[]>(
    () => [...saved, ...pending],
    [saved, pending],
  );
  const scrollRef = useRef<HTMLDivElement>(null);
  // Marca a lista hidratada (data-ready), como o formulário de "Entrar": antes disso, a rolagem e
  // o sentinela ainda não respondem.
  useEffect(() => {
    scrollRef.current?.setAttribute("data-ready", "");
  }, []);
  const sentinelRef = useRef<HTMLDivElement>(null);
  // Âncora da rolagem, guardada antes de a página anterior entrar no começo: a Mensagem que abria
  // a lista e a posição do fim dela na área visível. O fim, e não o topo, porque essa Mensagem
  // pode virar compacta e perder o divisor quando a anterior chega, e encolhe por cima.
  const anchor = useRef<{ id: string; bottom: number } | null>(null);
  // A forma e o divisor de cada Mensagem, com o dia de cada uma calculado uma vez por lista.
  const rows = useMemo(() => {
    const today = dayKey(renderedAt, timeZone);
    const withDays = messages.map((message) => ({
      ...message,
      day: dayKey(message.createdAt, timeZone),
    }));
    return withDays.map((message, index) => {
      const previous = withDays[index - 1];
      return {
        message,
        compact: isCompact(previous, message),
        dayLabel: previous?.day === message.day ? undefined : labelForDay(message.day, today),
      };
    });
  }, [messages, timeZone, renderedAt]);
  const firstId = messages[0]?.id;
  const lastId = messages.at(-1)?.id;

  // Se a Pessoa está no fim da lista, medido a cada rolagem, antes de uma Mensagem nova entrar.
  const isAtEnd = useRef(true);
  const [hasNewBelow, setHasNewBelow] = useState(false);
  const opened = useRef(false);

  function scrollToEnd() {
    const element = scrollRef.current;
    if (element) element.scrollTop = element.scrollHeight;
    anchor.current = null;
  }

  function onScroll() {
    const element = scrollRef.current;
    if (!element) return;
    isAtEnd.current =
      element.scrollHeight - element.scrollTop - element.clientHeight <= END_OF_LIST_PX;
    if (isAtEnd.current) setHasNewBelow(false);
  }

  // Ao abrir, a lista rola até a última Mensagem. Depois, uma Mensagem nova no fim só rola a lista
  // quando a Pessoa estava no fim ou quando é dela; lendo mais acima, a lista fica parada e aparece
  // a pílula (spec da F03, "Rolagem e pílula"). A posição guardada antes de uma carga de anteriores
  // deixa de valer quando a lista vai ao fim.
  const lastAuthorId = messages.at(-1)?.author.id;
  useLayoutEffect(() => {
    if (!opened.current || isAtEnd.current || lastAuthorId === currentPerson.id) {
      opened.current = true;
      scrollToEnd();
      setHasNewBelow(false);
      return;
    }
    setHasNewBelow(true);
  }, [lastId, lastAuthorId, currentPerson.id]);

  // Quando a página anterior entra no começo, a Mensagem que a Pessoa lia fica no mesmo lugar: a
  // rolagem é devolvida pela posição da âncora, sem depender do overflow-anchor do navegador.
  useLayoutEffect(() => {
    const element = scrollRef.current;
    const saved = anchor.current;
    anchor.current = null;
    if (!element || !saved) return;
    const bottom = anchorBottom(element, saved.id);
    if (bottom !== null) element.scrollTop += bottom - saved.bottom;
  }, [firstId]);

  // Uma carga que falhou não devolve a rolagem depois.
  useEffect(() => {
    if (olderFailed) anchor.current = null;
  }, [olderFailed]);

  // Quem pediu as anteriores pelo teclado não perde o foco quando a última página chega e o botão
  // dá lugar ao começo do Canal: o foco vai para a área do histórico.
  const loadOlderButtonRef = useRef<HTMLButtonElement>(null);
  const hadButtonFocus = useRef(false);
  useLayoutEffect(() => {
    if (!hasOlder && hadButtonFocus.current) scrollRef.current?.focus();
    hadButtonFocus.current = false;
  }, [hasOlder]);

  function requestOlder() {
    const element = scrollRef.current;
    const bottom = element && firstId ? anchorBottom(element, firstId) : null;
    anchor.current = firstId && bottom !== null ? { id: firstId, bottom } : null;
    hadButtonFocus.current = document.activeElement === loadOlderButtonRef.current;
    loadOlder();
  }
  const onSentinelVisible = useEffectEvent(requestOlder);

  // O sentinela no topo pede a página anterior quando chega perto da área visível. Depois de uma
  // falha, ele espera o link. O observer é recriado a cada vez que volta a observar, o que já
  // confere de novo se o sentinela está à vista.
  const canObserve = hasOlder && !isLoadingOlder && !olderFailed;
  useEffect(() => {
    const root = scrollRef.current;
    const sentinel = sentinelRef.current;
    if (!canObserve || !root || !sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) onSentinelVisible();
      },
      { root, rootMargin: `${LOAD_OLDER_MARGIN_PX}px 0px 0px 0px` },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [canObserve]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="relative flex min-h-0 flex-1 flex-col">
      <div
        ref={scrollRef}
        onScroll={onScroll}
        role="region"
        aria-label={`Histórico de #${conversation.name}`}
        // Marca o histórico em dia com o tempo real, que os testes esperam antes de agir.
        data-synced={isSynced ? "" : undefined}
        tabIndex={0}
        className="group/history flex min-h-0 flex-1 flex-col overflow-y-auto pb-2"
      >
        <div className="mt-auto" />
        {hasOlder ? (
          <div ref={sentinelRef} className="flex h-12 shrink-0 items-center justify-center">
            {/* O botão fica montado durante a carga, para quem chegou pelo teclado não perder o
                foco; só o conteúdo vira o indicador ("Conversa / Lista / Carregando anteriores"). */}
            <button
              ref={loadOlderButtonRef}
              type="button"
              onClick={requestOlder}
              aria-busy={isLoadingOlder}
              className={buttonVariants({ variant: "link", className: "text-small" })}
            >
              {isLoadingOlder ? (
                <span className="text-fg-muted">
                  <Spinner size="md" />
                  <span className="sr-only">Carregando mensagens anteriores</span>
                </span>
              ) : (
                "Carregar mensagens anteriores"
              )}
            </button>
          </div>
        ) : (
          <ConversationIntro name={conversation.name} topic={conversation.topic} />
        )}
        <ol aria-label={`Mensagens em #${conversation.name}`} className="flex flex-col">
          {rows.map(({ message, compact, dayLabel }) => (
            <MessageItem
              // Pela autora e pelo client_id, a Mensagem "enviando" vira a gravada no mesmo item.
              key={`${message.author.id}:${message.clientId}`}
              message={message}
              timeZone={timeZone}
              compact={compact}
              dayLabel={dayLabel}
              status={message.status ?? "sent"}
              onRetry={message.status ? () => retry(message as PendingMessage) : undefined}
              onDiscard={message.status ? () => discard(message.clientId) : undefined}
            />
          ))}
        </ol>
      </div>
      {hasNewBelow ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-2 flex justify-center">
          <div className="pointer-events-auto">
            <NewMessagesPill onClick={scrollToEnd} />
          </div>
        </div>
      ) : null}
      </div>
      {/* Lugar do "digitando", que entra na F03. */}
      <div className="h-5 shrink-0" />
      <MessageComposer
        conversationName={conversation.name}
        onSend={send}
      />
    </div>
  );
}

// Posição do fim da Mensagem em relação ao topo da área de rolagem.
function anchorBottom(container: HTMLElement, messageId: string): number | null {
  const item = container.querySelector(`[data-message-id="${CSS.escape(messageId)}"]`);
  if (!item) return null;
  return item.getBoundingClientRect().bottom - container.getBoundingClientRect().top;
}
