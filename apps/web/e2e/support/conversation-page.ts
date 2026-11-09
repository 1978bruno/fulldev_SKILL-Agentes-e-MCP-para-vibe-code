import type { Locator, Page } from "@playwright/test";

// O histórico da Conversa depois de hidratado: antes disso, rolar não pede as anteriores, e a
// abertura leva a lista de volta ao fim.
export async function readyHistory(page: Page, channelName: string): Promise<Locator> {
  const history = page.getByRole("region", { name: `Histórico de #${channelName}` });
  await history.and(page.locator("[data-ready]")).waitFor();
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

export function conversationIntro(page: Page, channelName: string): Locator {
  return page.getByRole("heading", { name: `Este é o começo do canal #${channelName}` });
}
