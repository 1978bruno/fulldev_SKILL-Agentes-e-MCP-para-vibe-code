// spec: e2e/plano-de-testes-f02.md
// seed: e2e/seed.spec.ts
import { expect, test } from "../fixtures";

test.describe("Gaveta", () => {
  test("gaveta-na-home-vazia", async ({ page, loggedInPage }) => {
    void loggedInPage;
    await page.setViewportSize({ width: 767, height: 900 });

    // 1. Sem Canais, a Home vazia em 767 tem o botão da gaveta
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Nenhuma conversa ainda" })).toBeVisible();
    await page.getByRole("button", { name: "Abrir navegação" }).click();

    await expect(
      page.getByRole("dialog", { name: "Navegação" }).getByRole("region", { name: "Canais" }),
    ).toBeVisible();
  });
});
