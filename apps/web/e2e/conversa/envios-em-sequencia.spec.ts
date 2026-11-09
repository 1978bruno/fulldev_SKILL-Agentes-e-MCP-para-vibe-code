// spec: e2e/plano-de-testes-f02.md
// seed: e2e/seed.spec.ts
import { expect, test } from "../fixtures";
import { messageList, readyHistory } from "../support/conversation-page";

test.describe("Enviar uma Mensagem", () => {
  test("envios-em-sequencia", async ({ page, memberChannel: channel, loggedInPage }) => {
    void loggedInPage;
    await page.goto(`/conversas/${channel.id}`);
    await readyHistory(page, channel.name);
    const caixa = page.getByRole("textbox", { name: `Mensagem para #${channel.name}` });
    const itens = messageList(page, channel.name).getByRole("listitem");

    // 1. Três envios seguidos, sem esperar
    for (const texto of ["um", "dois", "três"]) {
      await caixa.fill(texto);
      await caixa.press("Enter");
    }

    await expect(itens).toHaveText([/um$/, /dois$/, /três$/]);
    await expect(itens.and(page.locator('[data-status="sent"]'))).toHaveCount(3);

    // 2. Recarregar: a ordem gravada é a do envio
    await page.reload();
    await readyHistory(page, channel.name);
    await expect(itens).toHaveText([/um$/, /dois$/, /três$/]);
  });
});
