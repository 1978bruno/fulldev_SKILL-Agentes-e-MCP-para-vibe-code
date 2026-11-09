// spec: e2e/plano-de-testes-f01.md
// seed: e2e/seed.spec.ts
import { expect, test } from "../fixtures";
import { deleteSessionsOf } from "../support/database";

test.describe("Sessão que acaba", () => {
  test("sessao-revogada-volta-para-entrar", async ({ loggedInPage: page, person }) => {
    // 1. Com a Pessoa logada, revogar as Sessões dela no banco
    await deleteSessionsOf(person.id);

    // 2. Navegar para / de novo
    await page.goto("/");

    await expect(page).toHaveURL("/entrar");
    await expect(page.getByRole("button", { name: "Entrar" })).toBeVisible();
  });
});
