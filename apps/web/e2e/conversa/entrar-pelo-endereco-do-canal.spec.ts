// spec: e2e/plano-de-testes-f02.md
// seed: e2e/seed.spec.ts
import { expect, test } from "../fixtures";
import { waitForLoginForm } from "../support/login-page";

test.describe("Abrir um Canal pelo link", () => {
  test("entrar-pelo-endereco-do-canal", async ({ page, person, memberChannel: channel }) => {
    // 1. Sem Sessão, abrir o endereço do Canal
    await page.goto(`/conversas/${channel.id}`);

    await expect(page).toHaveURL(`/entrar?para=%2Fconversas%2F${channel.id}`);
    await waitForLoginForm(page);

    // 2. Entrar
    await page.getByRole("textbox", { name: "E-mail" }).fill(person.email);
    await page.getByLabel("Senha").fill(person.password);
    await page.getByRole("button", { name: "Entrar" }).click();

    await expect(page).toHaveURL(`/conversas/${channel.id}`);
    await expect(page.getByRole("heading", { level: 1, name: channel.name })).toBeVisible();
  });
});
