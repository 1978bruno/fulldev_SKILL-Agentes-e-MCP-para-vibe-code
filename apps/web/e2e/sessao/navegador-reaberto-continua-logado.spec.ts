// spec: e2e/plano-de-testes-f01.md
// seed: e2e/seed.spec.ts
import { expect, test } from "../fixtures";

test.describe("Continuar logada", () => {
  test("navegador-reaberto-continua-logado", async ({ loggedInPage, browser }) => {
    // 1. Guardar os cookies e fechar o navegador
    const storageState = await loggedInPage.context().storageState();
    await loggedInPage.context().close();

    // 2. Reabrir num contexto novo com os cookies guardados e abrir /
    const reopened = await browser.newContext({ storageState });
    const page = await reopened.newPage();
    await page.goto("/");

    await expect(page).toHaveURL("/");
    await expect(page.getByRole("heading", { name: "Nenhuma conversa ainda" })).toBeVisible();
    await reopened.close();
  });
});
