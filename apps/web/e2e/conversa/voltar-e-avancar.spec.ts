// spec: e2e/plano-de-testes-f02.md
// seed: e2e/seed.spec.ts
import { expect, test } from "../fixtures";
import { insertChannel } from "../support/database";

test.describe("Abrir um Canal pelo link", () => {
  test("voltar-e-avancar", async ({ page, person, loggedInPage }) => {
    void loggedInPage;
    const second = await insertChannel([person], { name: `e2e-b-${person.id}` });
    const first = await insertChannel([person], { name: `e2e-a-${person.id}` });
    await page.goto(`/conversas/${first.id}`);

    // 1. Trocar de Canal pela barra lateral
    await page.getByRole("region", { name: "Canais" }).getByRole("link", { name: second.name }).click();
    await expect(page.getByRole("heading", { level: 1, name: second.name })).toBeVisible();

    // 2. Voltar e avançar no navegador
    await page.goBack();
    await expect(page).toHaveURL(`/conversas/${first.id}`);
    await expect(page.getByRole("heading", { level: 1, name: first.name })).toBeVisible();

    await page.goForward();
    await expect(page).toHaveURL(`/conversas/${second.id}`);
    await expect(page.getByRole("heading", { level: 1, name: second.name })).toBeVisible();
  });
});
