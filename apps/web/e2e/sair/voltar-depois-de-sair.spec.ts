// spec: e2e/plano-de-testes-f01.md
// seed: e2e/seed.spec.ts
import { expect, test } from "../fixtures";

test.describe("Sair", () => {
  test("voltar-depois-de-sair", async ({ loggedInPage: page, person }) => {
    // 1. Recarregar a Home: a resposta sai sem cache
    const response = await page.goto("/");
    expect(response?.headers()["cache-control"]).toContain("no-store");

    // 2. Sair pelo menu
    await page.getByRole("button", { name: `Menu de ${person.name}` }).click();
    await page.getByRole("menuitem", { name: "Sair do Full Cycle" }).click();
    await expect(page).toHaveURL("/entrar");

    // 3. Voltar pelo histórico
    await page.goBack();

    await expect(page).toHaveURL("/entrar");
    await expect(page.getByRole("heading", { name: "Nenhuma conversa ainda" })).toBeHidden();
  });
});
