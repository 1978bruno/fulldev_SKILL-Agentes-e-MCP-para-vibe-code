// spec: e2e/plano-de-testes-f01.md
// seed: e2e/seed.spec.ts
import { expect, test } from "../fixtures";

test.describe("Voltar para onde ia", () => {
  test("logada-em-entrar-vai-para-a-home", async ({ loggedInPage: page }) => {
    // 1. Logada, abrir /entrar
    await page.goto("/entrar");

    await expect(page).toHaveURL("/");
    await expect(page.getByRole("heading", { name: "Nenhuma conversa ainda" })).toBeVisible();
  });
});
