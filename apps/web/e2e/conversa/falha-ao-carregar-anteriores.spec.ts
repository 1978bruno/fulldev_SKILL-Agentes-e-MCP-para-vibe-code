// spec: e2e/plano-de-testes-f02.md
// seed: e2e/seed.spec.ts
import { expect, test } from "../fixtures";
import { readyHistory, scrollHistoryToTop } from "../support/conversation-page";
import { insertHistory } from "../support/database";

test.describe("Histórico até a primeira Mensagem", () => {
  test("falha-ao-carregar-anteriores", async ({
    page,
    person,
    memberChannel: channel,
    loggedInPage,
  }) => {
    void loggedInPage;
    await insertHistory(channel, person, 60);
    await page.goto(`/conversas/${channel.id}`);
    const mensagens = page.getByRole("list", { name: `Mensagens em #${channel.name}` });
    await expect(mensagens.getByRole("listitem")).toHaveCount(50);

    // 1. Com a rota das anteriores fora do ar, rolar até o topo
    const rota = `**/api/conversations/${channel.id}/messages?*`;
    await page.route(rota, (route) => route.abort());
    await scrollHistoryToTop(await readyHistory(page, channel.name));

    const botao = page.getByRole("button", { name: "Carregar mensagens anteriores" });
    await expect(botao).toBeVisible();
    await expect(botao).not.toHaveAttribute("aria-busy", "true");
    await expect(mensagens.getByRole("listitem")).toHaveCount(50);

    // 2. Com a rota de volta, o link carrega as anteriores
    await page.unroute(rota);
    await botao.click();

    await expect(mensagens.getByRole("listitem")).toHaveCount(60);
    await expect(
      page.getByRole("heading", { name: `Este é o começo do canal #${channel.name}` }),
    ).toBeVisible();
  });
});
