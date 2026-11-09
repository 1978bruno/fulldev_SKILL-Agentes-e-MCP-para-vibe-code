// spec: e2e/plano-de-testes-f01.md
// seed: e2e/seed.spec.ts
import { expect, test } from "../fixtures";

test.describe("Voltar para onde ia", () => {
  test("verificacao-falhou-mostra-o-formulario", async ({ loggedInPage: page }) => {
    // 1. Com cookie, abrir "Entrar" com a marca de verificação que acabou de falhar
    await page.goto("/entrar?verificacao=falhou&para=%2F%3Faba%3Dx");

    await expect(page.getByRole("button", { name: "Entrar" })).toBeVisible();
    await expect(page).toHaveURL("/entrar?para=%2F%3Faba%3Dx");
  });
});
