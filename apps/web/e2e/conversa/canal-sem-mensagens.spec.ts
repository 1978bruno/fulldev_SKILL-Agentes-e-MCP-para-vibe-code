// spec: e2e/plano-de-testes-f02.md
// seed: e2e/seed.spec.ts
import { expect, test } from "../fixtures";
import { conversationIntro, messageList } from "../support/conversation-page";

test.describe("Histórico até a primeira Mensagem", () => {
  test("canal-sem-mensagens", async ({ page, memberChannel: channel, loggedInPage }) => {
    void loggedInPage;
    // 1. Abrir um Canal sem Mensagens
    await page.goto(`/conversas/${channel.id}`);

    await expect(
      conversationIntro(page, channel.name),
    ).toBeVisible();
    await expect(page.getByText("Canal de teste").last()).toBeVisible();
    await expect(
      messageList(page, channel.name).getByRole("listitem"),
    ).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Carregar mensagens anteriores" })).toHaveCount(0);
  });
});
