// spec: e2e/plano-de-testes-f01.md
// seed: e2e/seed.spec.ts
import { expect, test } from "../fixtures";

test.describe("Sem Sessão", () => {
  test("redireciona-sem-sessao", async ({ page }) => {
    // 1. Sem cookie, abrir /
    await page.goto("/");

    await expect(page).toHaveURL("/entrar");
  });
});
