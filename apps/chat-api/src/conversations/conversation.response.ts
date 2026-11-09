import { ConversationKind } from './conversation.entity';
import type { ConversationSummary } from './conversations.service';

export interface ConversationResponse {
  id: string;
  kind: ConversationKind;
  name: string | null;
  topic: string | null;
  member_count: number;
}

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
