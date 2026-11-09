// spec: e2e/plano-de-testes-f01.md
// seed: e2e/seed.spec.ts
import { expect, test } from "../fixtures";

test.describe("Entrar", () => {
  test("entrar-pelo-teclado", async ({ page, person }) => {
    // 1. Abrir /entrar; o foco começa no E-mail
    await page.goto("/entrar");
    await expect(page.getByRole("textbox", { name: "E-mail" })).toBeFocused();

    // 2. Digitar o e-mail, Tab, digitar a senha, Tab até o botão
    await page.keyboard.type(person.email);
    await page.keyboard.press("Tab");
    await expect(page.getByLabel("Senha")).toBeFocused();
    await page.keyboard.type(person.password);
    await page.keyboard.press("Tab");
    await expect(page.getByRole("button", { name: "Entrar" })).toBeFocused();

    // 3. Voltar com Shift+Tab para a Senha e apertar Enter
    await page.keyboard.press("Shift+Tab");
    await page.keyboard.press("Enter");

    await expect(page).toHaveURL("/");
    await expect(page.getByRole("heading", { name: "Nenhuma conversa ainda" })).toBeVisible();
  });
});
