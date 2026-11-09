// spec: e2e/plano-de-testes-f02.md
// seed: e2e/seed.spec.ts
import { expect, test } from "../fixtures";
import { readyHistory, scrollHistoryToTop } from "../support/conversation-page";
import { insertHistory } from "../support/database";

test.describe("Histórico até a primeira Mensagem", () => {
  test("rolar-ate-o-comeco", async ({ page, person, memberChannel: channel, loggedInPage }) => {
    void loggedInPage;
    // 1. Abrir um Canal com 75 Mensagens: a página mais recente tem 50
    await insertHistory(channel, person, 75);
    await page.goto(`/conversas/${channel.id}`);
    const mensagens = page.getByRole("list", { name: `Mensagens em #${channel.name}` });
    await expect(mensagens.getByRole("listitem")).toHaveCount(50);
    await expect(mensagens.getByRole("listitem").last()).toContainText("Mensagem 75");

    // 2. Rolar até o topo: a página anterior vem pela rota do BFF
    const historico = await readyHistory(page, channel.name);
    const anterior = page.waitForResponse(
      (response) =>
        response.url().includes(`/api/conversations/${channel.id}/messages?before=`) &&
        response.status() === 200,
    );
    const lida = mensagens.getByRole("listitem").filter({ hasText: /^.*Mensagem 26$/ });
    await scrollHistoryToTop(historico);
    const antes = (await lida.boundingBox())!.y;
    await anterior;

    await expect(mensagens.getByRole("listitem")).toHaveCount(75);
    await expect(mensagens.getByRole("listitem").first()).toContainText("Mensagem 1");
    // A Mensagem que estava no topo continua no mesmo lugar da tela.
    await expect.poll(async () => Math.abs((await lida.boundingBox())!.y - antes)).toBeLessThan(4);

    // 3. Rolar até o topo de novo: o começo do Canal
    await scrollHistoryToTop(historico);
    await expect(
      page.getByRole("heading", { name: `Este é o começo do canal #${channel.name}` }),
    ).toBeVisible();
  });
});
