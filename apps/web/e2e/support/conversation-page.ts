import type { Locator, Page } from "@playwright/test";

// O histórico da Conversa depois de hidratado e em dia com o tempo real: antes disso, rolar não
// pede as anteriores, a abertura leva a lista de volta ao fim, e o reset da conexão ainda recarrega
// a página mais recente.
export async function readyHistory(page: Page, channelName: string): Promise<Locator> {
  const history = page.getByRole("region", { name: `Histórico de #${channelName}` });
  await history.and(page.locator("[data-ready][data-synced]")).waitFor();
  return history;
}

export async function scrollHistoryToTop(history: Locator): Promise<void> {
  await history.evaluate((element) => {
    element.scrollTop = 0;
  });
}

export function messageList(page: Page, channelName: string): Locator {
  return page.getByRole("list", { name: `Mensagens em #${channelName}` });
}

// Os itens da lista de Mensagens com o texto dado.
export function messageItem(page: Page, channelName: string, text: string): Locator {
  return messageList(page, channelName).getByRole("listitem").filter({ hasText: text });
}

// A caixa de mensagem do Canal.
export function composer(page: Page, channelName: string): Locator {
  return page.getByRole("textbox", { name: `Mensagem para #${channelName}` });
}

export function conversationIntro(page: Page, channelName: string): Locator {
  return page.getByRole("heading", { name: `Este é o começo do canal #${channelName}` });
}

// O envio de Mensagem é um Server Action: um POST para a própria página, com o cabeçalho
// next-action. `handler` decide o que fazer com cada envio.
export async function routeSendMessage(
  page: Page,
  handler: Parameters<Page["route"]>[1],
): Promise<() => Promise<void>> {
  const matcher = (url: URL) => url.pathname.startsWith("/conversas/");
  await page.route(matcher, async (route, request) => {
    if (request.method() === "POST" && (await request.headerValue("next-action"))) {
      return handler(route, request);
    }
    return route.fallback();
  });
  return () => page.unroute(matcher);
}

// Leva a lista para longe do fim (e longe do topo, para não pedir as anteriores) e devolve a
// posição da rolagem.
export async function scrollAwayFromEnd(history: Locator): Promise<number> {
  return history.evaluate((element) => {
    element.scrollTop = element.scrollHeight - element.clientHeight - 600;
    element.dispatchEvent(new Event("scroll"));
    return element.scrollTop;
  });
}

// A distância da rolagem até o fim da lista.
export function distanceToEnd(history: Locator): Promise<number> {
  return history.evaluate(
    (element) => element.scrollHeight - element.scrollTop - element.clientHeight,
  );
}
