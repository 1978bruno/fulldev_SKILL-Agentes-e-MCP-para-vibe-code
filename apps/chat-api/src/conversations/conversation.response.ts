import { Conversation, ConversationKind } from './conversation.entity';

export interface ConversationResponse {
  id: string;
  kind: ConversationKind;
  name: string | null;
  topic: string | null;
  member_count: number;
}

export function toConversationResponse(
  conversation: Conversation,
  memberCount: number,
): ConversationResponse {
  return {
    id: conversation.id,
    kind: conversation.kind,
    name: conversation.name,
    topic: conversation.topic,
    member_count: memberCount,
  };
}
