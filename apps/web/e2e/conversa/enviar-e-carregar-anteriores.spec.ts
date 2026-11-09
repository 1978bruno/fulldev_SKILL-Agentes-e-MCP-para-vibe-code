// spec: e2e/plano-de-testes-f02.md
// seed: e2e/seed.spec.ts
import { expect, test } from "../fixtures";
import { messageList, readyHistory, scrollHistoryToTop } from "../support/conversation-page";
import { insertHistory } from "../support/database";

test.describe("Histórico até a primeira Mensagem", () => {
  test("enviar-e-carregar-anteriores", async ({
    page,
    person,
    memberChannel: channel,
    loggedInPage,
  }) => {
    void loggedInPage;
    await insertHistory(channel, person, 60);
    await page.goto(`/conversas/${channel.id}`);
    const historico = await readyHistory(page, channel.name);
    const mensagens = messageList(page, channel.name);

    // 1. Enviar uma Mensagem
    const caixa = page.getByRole("textbox", { name: `Mensagem para #${channel.name}` });
    await caixa.fill("Recém-enviada");
    await caixa.press("Enter");
    await expect(mensagens.getByRole("listitem").last()).toContainText("Recém-enviada");

    // 2. Carregar as anteriores
    await scrollHistoryToTop(historico);

    await expect(mensagens.getByRole("listitem")).toHaveCount(61);
    await expect(mensagens.getByRole("listitem").last()).toContainText("Recém-enviada");
  });
});
