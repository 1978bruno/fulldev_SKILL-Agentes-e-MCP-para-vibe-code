// spec: e2e/plano-de-testes-f02.md
// seed: e2e/seed.spec.ts
import { expect, test } from "../fixtures";
import { conversationIntro, messageList, readyHistory, scrollHistoryToTop } from "../support/conversation-page";
import { insertHistory } from "../support/database";

test.describe("Histórico até a primeira Mensagem", () => {
  test("rolar-ate-o-comeco", async ({ page, person, memberChannel: channel, loggedInPage }) => {
    void loggedInPage;
    // 1. Abrir um Canal com 75 Mensagens: a página mais recente tem 50
    await insertHistory(channel, person, 75);
    await page.goto(`/conversas/${channel.id}`);
    const mensagens = messageList(page, channel.name);
    await expect(mensagens.getByRole("listitem")).toHaveCount(50);
    await expect(mensagens.getByRole("listitem").last()).toContainText("Mensagem 75");

    // 2. Rolar até o topo: a página anterior vem pela rota do BFF
    const historico = await readyHistory(page, channel.name);
    const anterior = page.waitForResponse(
      (response) =>
        response.url().includes(`/api/conversations/${channel.id}/messages?before=`) &&
        response.status() === 200,
    );
    // A "Mensagem 26" abre a página e vira compacta quando a anterior chega: o fim dela fica no lugar.
    const lida = mensagens.getByRole("listitem").filter({ hasText: /Mensagem 26$/ });
    await scrollHistoryToTop(historico);
    const fimDe = async () => {
      const box = (await lida.boundingBox())!;
      return box.y + box.height;
    };
    const antes = await fimDe();
    await anterior;

    await expect(mensagens.getByRole("listitem")).toHaveCount(75);
    await expect(mensagens.getByRole("listitem").first()).toContainText("Mensagem 1");
    // A Mensagem que a Pessoa lia continua no mesmo lugar da tela.
    await expect.poll(async () => Math.abs((await fimDe()) - antes)).toBeLessThan(4);

    // 3. Rolar até o topo de novo: o começo do Canal
    await scrollHistoryToTop(historico);
    await expect(
      conversationIntro(page, channel.name),
    ).toBeVisible();
  });
});
