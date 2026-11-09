"use client";

import { useEffect } from "react";
import { writeClientCookie } from "@/app/utils/client-cookies";
import { LAST_CONVERSATION_COOKIE } from "@/app/utils/last-conversation";

// Guarda a Conversa aberta como a última daquele navegador, para a Home voltar a ela.
export function RememberConversation({ conversationId }: { conversationId: string }) {
  useEffect(() => {
    writeClientCookie(LAST_CONVERSATION_COOKIE, conversationId);
  }, [conversationId]);
  return null;
}
