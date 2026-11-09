import { Conversation, ConversationKind } from './conversation.entity';

export interface ConversationResponse {
  id: string;
  kind: ConversationKind;
  name: string | null;
  topic: string | null;
}

export function toConversationResponse(
  conversation: Conversation,
): ConversationResponse {
  return {
    id: conversation.id,
    kind: conversation.kind,
    name: conversation.name,
    topic: conversation.topic,
  };
}
