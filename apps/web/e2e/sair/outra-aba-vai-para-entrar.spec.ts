// spec: e2e/plano-de-testes-f01.md
// seed: e2e/seed.spec.ts
import { expect, test } from "../fixtures";

test.describe("Sair", () => {
  test("outra-aba-vai-para-entrar", async ({ loggedInPage: page, person, context }) => {
    // 1. Abrir a Home numa segunda aba do mesmo navegador
    const otherTab = await context.newPage();
    await otherTab.goto("/");
    await expect(otherTab.getByRole("heading", { name: "Nenhuma conversa ainda" })).toBeVisible();

    // 2. Sair na primeira aba
    await page.getByRole("button", { name: `Menu de ${person.name}` }).click();
    await page.getByRole("menuitem", { name: "Sair do Full Cycle" }).click();
    await expect(page).toHaveURL("/entrar");

    // 3. Na segunda aba, a próxima navegação
    await otherTab.goto("/");

    await expect(otherTab).toHaveURL("/entrar");
  });
});
