"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { sendMessage } from "@/app/actions/send-message";
import type { Message, MessageAuthor } from "@/app/services/chat-api";
import { newClientId } from "@/app/utils/client-id";
import { redirectToExpiredSession } from "@/app/utils/return-path";

export type PendingStatus = "sending" | "failed";

export type PendingMessage = Message & { status: PendingStatus };

// Mensagens ainda não gravadas (spec da F02, "Envio"): fora do cache do SWR, na ordem do envio,
// sempre depois das gravadas. Uma fila manda uma por vez, para a ordem gravada ser a do envio; uma
// falha não trava as seguintes. Gravada, a Mensagem sai daqui e entra no cache (`onSent`).
export function usePendingMessages(
  conversationId: string,
  author: MessageAuthor,
  onSent: (message: Message) => void,
) {
  const [pending, setPending] = useState<PendingMessage[]>([]);
  const inFlight = useRef<string | null>(null);

  useEffect(() => {
    if (inFlight.current) return;
    const next = pending.find((message) => message.status === "sending");
    if (!next) return;
    inFlight.current = next.clientId;
    void (async () => {
      let sent: Message | null = null;
      try {
        const result = await sendMessage(conversationId, next.clientId, next.body);
        if (result.kind === "unauthenticated") return redirectToExpiredSession();
        if (result.kind === "ok") sent = result.message;
      } catch {
        // Rede fora: o Server Action nem respondeu. Vira falha, como os outros erros.
      }
      if (sent) onSent(sent);
      const delivered = sent !== null;
      setPending((current) =>
        delivered
          ? current.filter((message) => message.clientId !== next.clientId)
          : current.map((message) =>
              message.clientId === next.clientId ? { ...message, status: "failed" } : message,
            ),
      );
      inFlight.current = null;
    })();
  }, [pending, conversationId, onSent]);

  const send = useCallback(
    (body: string) => {
      const clientId = newClientId();
      setPending((current) => [
        ...current,
        {
          id: `pending-${clientId}`,
          conversationId,
          clientId,
          author,
          body,
          createdAt: new Date().toISOString(),
          status: "sending",
        },
      ]);
    },
    [conversationId, author],
  );

  // Reenvia com o mesmo client_id: a API devolve a já gravada, se o primeiro envio chegou.
  const retry = useCallback((clientId: string) => {
    setPending((current) =>
      current.map((message) =>
        message.clientId === clientId ? { ...message, status: "sending" } : message,
      ),
    );
  }, []);

  const discard = useCallback((clientId: string) => {
    setPending((current) => current.filter((message) => message.clientId !== clientId));
  }, []);

  return { pending, send, retry, discard };
}
