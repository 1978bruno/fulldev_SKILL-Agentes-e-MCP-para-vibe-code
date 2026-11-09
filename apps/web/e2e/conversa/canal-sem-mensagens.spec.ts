// spec: e2e/plano-de-testes-f02.md
// seed: e2e/seed.spec.ts
import { expect, test } from "../fixtures";

test.describe("Histórico até a primeira Mensagem", () => {
  test("canal-sem-mensagens", async ({ page, memberChannel: channel, loggedInPage }) => {
    void loggedInPage;
    // 1. Abrir um Canal sem Mensagens
    await page.goto(`/conversas/${channel.id}`);

    await expect(
      page.getByRole("heading", { name: `Este é o começo do canal #${channel.name}` }),
    ).toBeVisible();
    await expect(page.getByText("Canal de teste").last()).toBeVisible();
    await expect(
      page.getByRole("list", { name: `Mensagens em #${channel.name}` }).getByRole("listitem"),
    ).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Carregar mensagens anteriores" })).toHaveCount(0);
  });
});
