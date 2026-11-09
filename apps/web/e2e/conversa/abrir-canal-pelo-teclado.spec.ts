// spec: e2e/plano-de-testes-f02.md
// seed: e2e/seed.spec.ts
import { expect, test } from "../fixtures";
import { insertChannel } from "../support/database";

test.describe("Abrir um Canal", () => {
  test("abrir-canal-pelo-teclado", async ({ page, person, loggedInPage }) => {
    void loggedInPage;
    const second = await insertChannel([person], { name: `e2e-b-${person.id}` });
    const first = await insertChannel([person], { name: `e2e-a-${person.id}` });
    await page.goto(`/conversas/${first.id}`);
    const canais = page.getByRole("region", { name: "Canais" });

    // 1. Com o foco no primeiro Canal, Tab vai para o segundo, e Enter o abre
    await canais.getByRole("link", { name: first.name }).focus();
    await page.keyboard.press("Tab");
    await expect(canais.getByRole("link", { name: second.name })).toBeFocused();
    await page.keyboard.press("Enter");

    await expect(page).toHaveURL(`/conversas/${second.id}`);
    await expect(page.getByRole("heading", { level: 1, name: second.name })).toBeVisible();
  });
});
