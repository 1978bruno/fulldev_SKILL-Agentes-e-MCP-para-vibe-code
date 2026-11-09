import type { ConversationPayload } from 'chat-events';
import type { ConversationSummary } from './conversations.service';

// A Conversa do REST é a mesma do evento do tempo real (pacote chat-events).
export type ConversationResponse = ConversationPayload;

export function toConversationResponse({
  conversation,
  memberCount,
}: ConversationSummary): ConversationResponse {
  return {
    id: conversation.id,
    kind: conversation.kind,
    name: conversation.name,
    topic: conversation.topic,
    member_count: memberCount,
  };
}
