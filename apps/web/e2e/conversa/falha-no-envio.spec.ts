// spec: e2e/plano-de-testes-f02.md
// seed: e2e/seed.spec.ts
import { expect, test } from "../fixtures";
import { messageList, readyHistory, routeSendMessage } from "../support/conversation-page";
import { countMessagesWithBody } from "../support/database";

test.describe("Enviar uma Mensagem", () => {
  test("falha-no-envio", async ({ page, memberChannel: channel, loggedInPage }) => {
    void loggedInPage;
    await page.goto(`/conversas/${channel.id}`);
    await readyHistory(page, channel.name);
    const caixa = page.getByRole("textbox", { name: `Mensagem para #${channel.name}` });
    const itens = messageList(page, channel.name).getByRole("listitem");

    // 1. Com o envio fora do ar, duas Mensagens falham
    const restore = await routeSendMessage(page, (route) => route.abort());
    for (const texto of ["Primeira com falha", "Segunda com falha"]) {
      await caixa.fill(texto);
      await caixa.press("Enter");
    }
    const primeira = itens.filter({ hasText: "Primeira com falha" });
    const segunda = itens.filter({ hasText: "Segunda com falha" });
    await expect(primeira).toContainText("Não foi possível enviar.");
    await expect(segunda).toContainText("Não foi possível enviar.");

    // 2. Com a rede de volta, "Tentar de novo" grava uma Mensagem só
    await restore();
    await primeira.getByRole("button", { name: "Tentar de novo" }).click();
    await expect(primeira).toHaveAttribute("data-status", "sent");
    await expect(primeira).not.toContainText("Não foi possível enviar.");
    expect(await countMessagesWithBody(channel, "Primeira com falha")).toBe(1);

    // 3. "Descartar" tira a outra da lista
    await segunda.getByRole("button", { name: "Descartar" }).click();
    await expect(segunda).toHaveCount(0);
    expect(await countMessagesWithBody(channel, "Segunda com falha")).toBe(0);

    // 4. Recarregar tira uma que falhou
    const restoreAgain = await routeSendMessage(page, (route) => route.abort());
    await caixa.fill("Terceira com falha");
    await caixa.press("Enter");
    await expect(itens.filter({ hasText: "Terceira com falha" })).toContainText(
      "Não foi possível enviar.",
    );
    await restoreAgain();
    await page.reload();
    await readyHistory(page, channel.name);
    await expect(itens).toHaveCount(1);
    await expect(itens.first()).toContainText("Primeira com falha");
  });
});
