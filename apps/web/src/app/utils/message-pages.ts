import type { Message, MessagePage } from "@/app/services/chat-api";

// Forma do cache do histórico (spec da F02, "Leituras"): pages[0] é a página mais recente, e as
// anteriores entram depois dela. A renderização recebe a lista cronológica.
export function flattenPages(pages: MessagePage[]): Message[] {
  return pages.toReversed().flatMap((page) => page.messages);
}

// A Mensagem gravada pelo envio entra no fim de pages[0], sem repetir a que já está lá.
export function appendToLatestPage(pages: MessagePage[], message: Message): MessagePage[] {
  const [latest, ...older] = pages;
  if (!latest) return [{ messages: [message], hasMore: false }];
  if (latest.messages.some((existing) => existing.id === message.id)) return pages;
  return [{ ...latest, messages: [...latest.messages, message] }, ...older];
}
