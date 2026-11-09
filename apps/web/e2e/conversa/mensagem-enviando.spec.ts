// spec: e2e/plano-de-testes-f02.md
// seed: e2e/seed.spec.ts
import { expect, test } from "../fixtures";
import { messageList, readyHistory, routeSendMessage } from "../support/conversation-page";

test.describe("Enviar uma Mensagem", () => {
  test("mensagem-enviando", async ({ page, memberChannel: channel, loggedInPage }) => {
    void loggedInPage;
    await page.goto(`/conversas/${channel.id}`);
    await readyHistory(page, channel.name);
    let release!: () => void;
    const held = new Promise<void>((resolve) => (release = resolve));
    await routeSendMessage(page, async (route) => {
      await held;
      await route.continue();
    });

    // 1. Enviar com a gravação segurada
    const caixa = page.getByRole("textbox", { name: `Mensagem para #${channel.name}` });
    await caixa.fill("Segurando o envio");
    await caixa.press("Enter");

    const item = messageList(page, channel.name).getByRole("listitem").last();
    await expect(item).toContainText("Segurando o envio");
    await expect(item).toHaveAttribute("data-status", "sending");
    await expect(caixa).toHaveValue("");

    // 2. Liberar a gravação: o mesmo item passa a gravado
    const handle = await item.elementHandle();
    release();
    await expect(item).toHaveAttribute("data-status", "sent");
    expect(await handle!.evaluate((element) => element.isConnected)).toBe(true);
  });
});
