"use client";

import { useEffect } from "react";
import { COOKIE_MAX_AGE_SECONDS } from "@/app/utils/client-cookies";
import { LAST_CONVERSATION_COOKIE } from "@/app/utils/last-conversation";

// Guarda a Conversa aberta como a última daquele navegador, para a Home voltar a ela.
export function RememberConversation({ conversationId }: { conversationId: string }) {
  useEffect(() => {
    document.cookie = `${LAST_CONVERSATION_COOKIE}=${encodeURIComponent(conversationId)}; Path=/; Max-Age=${COOKIE_MAX_AGE_SECONDS}; SameSite=Lax`;
  }, [conversationId]);
  return null;
}
