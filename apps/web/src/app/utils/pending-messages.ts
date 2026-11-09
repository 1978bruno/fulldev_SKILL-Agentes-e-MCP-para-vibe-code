import type { Message } from "@/app/services/chat-api";

// Tira das pendentes a que acabou de ser gravada: mesma autora e mesmo client_id (spec da F03,
// "Mensagens no histórico"). A Mensagem pode chegar pelo evento antes da resposta do envio.
export function withoutDelivered<T extends Message>(pending: readonly T[], saved: Message): T[] {
  return pending.filter(
    (message) => !(message.clientId === saved.clientId && message.author.id === saved.author.id),
  );
}
