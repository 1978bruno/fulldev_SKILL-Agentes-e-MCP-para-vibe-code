import type { Message, MessagePage } from "@/app/services/chat-api";

// Forma do cache do histórico (spec da F02, "Leituras"): pages[0] é a página mais recente, e as
// anteriores entram depois dela. A renderização recebe a lista cronológica.
export function flattenPages(pages: MessagePage[]): Message[] {
  return pages.toReversed().flatMap((page) => page.messages);
}

// A Mensagem gravada pelo envio entra em pages[0], na ordem do id (UUID v7, a ordem da Conversa),
// sem repetir uma que já está em alguma página. Quase sempre ela é a mais nova e vai para o fim;
// um reenvio que a API devolve já gravada pode ser mais antigo que outras do fim.
export function appendToLatestPage(pages: MessagePage[], message: Message): MessagePage[] {
  const [latest, ...older] = pages;
  if (!latest) return [{ messages: [message], hasMore: false }];
  if (pages.some((page) => page.messages.some((existing) => existing.id === message.id))) {
    return pages;
  }
  // Mais antiga que o começo de pages[0], com mais histórico atrás: entrar ali mudaria o cursor
  // da página seguinte (que sai do começo de pages[0]) e esconderia Mensagens. Ela fica de fora e
  // chega com a página do servidor que a contém.
  const hasOlder = pages.length > 1 || latest.hasMore;
  const start = latest.messages[0];
  if (hasOlder && start && message.id < start.id) return pages;
  return [{ ...latest, messages: insertById(latest.messages, message) }, ...older];
}

// Encaixa a Mensagem na ordem do id (UUID v7, a ordem da Conversa). Quem chama já descartou o id
// repetido.
export function insertById(messages: readonly Message[], message: Message): Message[] {
  const position = messages.findLastIndex((existing) => existing.id < message.id) + 1;
  return messages.toSpliced(position, 0, message);
}
