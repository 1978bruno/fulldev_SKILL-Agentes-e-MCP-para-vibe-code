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
): readonly Conversation[] {
  if (list.some((item) => item.id === conversation.id)) {
    return list.map((item) =>
      item.id === conversation.id ? { ...item, memberCount: conversation.memberCount } : item,
    );
  }
  // Uma Conversa de que a Pessoa não é Membro: a lista fica a mesma, sem nova renderização.
  if (!personIds.includes(selfId)) return list;
  return [...list, conversation].sort((a, b) => compareNames(a.name, b.name));
}
