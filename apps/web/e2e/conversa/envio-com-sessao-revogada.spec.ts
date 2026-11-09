// spec: e2e/plano-de-testes-f02.md
// seed: e2e/seed.spec.ts
import { expect, test } from "../fixtures";
import { deleteSessionsOf } from "../support/database";

test.describe("Enviar uma Mensagem", () => {
  test("envio-com-sessao-revogada", async ({ page, person, memberChannel: channel, loggedInPage }) => {
    void loggedInPage;
    await page.goto(`/conversas/${channel.id}`);
    const caixa = page.getByRole("textbox", { name: `Mensagem para #${channel.name}` });
    await expect(caixa).toBeFocused();

    // 1. Revogar a Sessão e enviar
    await deleteSessionsOf(person.id);
    await caixa.fill("Ainda estou aqui?");
    await caixa.press("Enter");

    await expect(page).toHaveURL(`/entrar?para=%2Fconversas%2F${channel.id}`);
  });
});
