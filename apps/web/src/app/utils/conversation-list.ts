import type { Conversation } from "@/app/services/chat-api";
import { compareNames } from "./name-order";

// A lista de Conversas da barra lateral depois de um conversation.member_added (spec da F04,
// "Lista de Conversas no cliente"): quem acabou de entrar ganha a Conversa, na ordem alfabética e
// sem repetir; quem já era Membro só vê a quantidade de Membros mudar.
export function applyMemberAdded(
  list: readonly Conversation[],
  conversation: Conversation,
  personIds: readonly string[],
  selfId: string,
): Conversation[] {
  const index = list.findIndex((item) => item.id === conversation.id);
  if (index >= 0) {
    return list.map((item, position) =>
      position === index ? { ...item, memberCount: conversation.memberCount } : item,
    );
  }
  if (!personIds.includes(selfId)) return [...list];
  return [...list, conversation].sort((a, b) => compareNames(a.name, b.name));
}
