// spec: e2e/plano-de-testes-f01.md
// seed: e2e/seed.spec.ts
import { expect, test } from "../fixtures";

test.describe("Continuar logada", () => {
  test("segunda-aba-ja-logada", async ({ loggedInPage, context }) => {
    void loggedInPage;

    // 1. Com a Pessoa logada numa aba, abrir / em outra aba do mesmo navegador
    const secondTab = await context.newPage();
    await secondTab.goto("/");

    await expect(secondTab).toHaveURL("/");
    await expect(secondTab.getByRole("heading", { name: "Nenhuma conversa ainda" })).toBeVisible();
  });
});
