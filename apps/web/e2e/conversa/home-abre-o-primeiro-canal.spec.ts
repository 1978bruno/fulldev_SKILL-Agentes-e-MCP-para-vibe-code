// spec: e2e/plano-de-testes-f02.md
// seed: e2e/seed.spec.ts
import { expect, test } from "../fixtures";
import { insertChannel } from "../support/database";

test.describe("Canal ao entrar", () => {
  test("home-abre-o-primeiro-canal", async ({ page, person, loggedInPage }) => {
    void loggedInPage;
    // 1. Com dois Canais, abrir a Home
    await insertChannel([person], { name: `e2e-b-${person.id}` });
    const first = await insertChannel([person], { name: `e2e-a-${person.id}` });
    await page.goto("/");

    await expect(page).toHaveURL(`/conversas/${first.id}`);
    await expect(page.getByRole("heading", { level: 1, name: first.name })).toBeVisible();
  });
});
