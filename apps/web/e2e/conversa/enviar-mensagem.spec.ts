// spec: e2e/plano-de-testes-f02.md
// seed: e2e/seed.spec.ts
import { expect, test } from "../fixtures";

test.describe("Enviar uma Mensagem", () => {
  test("enviar-mensagem", async ({ page, person, memberChannel: channel, loggedInPage }) => {
    void loggedInPage;
    await page.goto(`/conversas/${channel.id}`);
    const caixa = page.getByRole("textbox", { name: `Mensagem para #${channel.name}` });
    const mensagens = page.getByRole("list", { name: `Mensagens em #${channel.name}` });

    // 1. Uma linha, Shift+Enter, outra linha e Enter
    await caixa.pressSequentially("linha um");
    await caixa.press("Shift+Enter");
    await caixa.pressSequentially("linha dois");
    await caixa.press("Enter");

    const ultima = mensagens.getByRole("listitem").last();
    await expect(ultima).toContainText(person.name);
    await expect(ultima.getByText("linha um\nlinha dois")).toBeVisible();
    await expect(caixa).toHaveValue("");

    // 2. Recarregar a página
    await page.reload();

    await expect(mensagens.getByRole("listitem").last()).toContainText("linha um\nlinha dois");
  });
});
