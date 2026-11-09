import type { ConversationPayload } from "chat-events";
import type { Conversation } from "@/app/services/chat-api";

// A Conversa da API, no REST ou num evento do tempo real, no formato da web.
export function conversationFromPayload(payload: ConversationPayload): Conversation {
  return {
    id: payload.id,
    kind: payload.kind,
    name: payload.name ?? "",
    topic: payload.topic,
    memberCount: payload.member_count,
  };
}
