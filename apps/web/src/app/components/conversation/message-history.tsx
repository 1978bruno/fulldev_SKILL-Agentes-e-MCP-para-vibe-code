"use client";

import { useLayoutEffect, useRef } from "react";
import { SWRConfig } from "swr";
import { MessageItem } from "@/app/components/message/message-item";
import { useMessageHistory } from "@/app/hooks/use-message-history";
import type { Conversation, MessagePage } from "@/app/services/chat-api";
import { MessageComposer } from "./message-composer";

type MessageHistoryProps = {
  conversation: Conversation;
  initialPage: MessagePage;
};

// Lista de Mensagens e caixa de mensagem de uma Conversa. O cache do SWR é desta montagem: abrir
// a Conversa de novo começa da página que o servidor acabou de ler.
export function MessageHistory(props: MessageHistoryProps) {
  return (
    <SWRConfig value={{ provider: () => new Map() }}>
      <History {...props} />
    </SWRConfig>
  );
}

function History({ conversation, initialPage }: MessageHistoryProps) {
  const { messages, appendSent } = useMessageHistory(conversation.id, initialPage);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastId = messages.at(-1)?.id;

  // Ao abrir e a cada Mensagem nova no fim, a lista rola até a última. Páginas anteriores, que
  // entram no começo, não mudam a última e não mexem na rolagem.
  useLayoutEffect(() => {
    const element = scrollRef.current;
    if (element) element.scrollTop = element.scrollHeight;
  }, [lastId]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div
        ref={scrollRef}
        role="region"
        aria-label={`Histórico de #${conversation.name}`}
        tabIndex={0}
        className="flex min-h-0 flex-1 flex-col overflow-y-auto pb-2"
      >
        <ol aria-label={`Mensagens em #${conversation.name}`} className="mt-auto flex flex-col">
          {messages.map((message) => (
            <MessageItem key={message.id} message={message} />
          ))}
        </ol>
      </div>
      {/* Lugar do "digitando", que entra na F03. */}
      <div className="h-5 shrink-0" />
      <MessageComposer
        conversationId={conversation.id}
        conversationName={conversation.name}
        onSent={appendSent}
      />
    </div>
  );
}
