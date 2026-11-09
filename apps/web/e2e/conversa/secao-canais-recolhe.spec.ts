// spec: e2e/plano-de-testes-f02.md
// seed: e2e/seed.spec.ts
import { expect, test } from "../fixtures";

test.describe("Barra lateral", () => {
  test("secao-canais-recolhe", async ({ page, memberChannel: channel, loggedInPage }) => {
    void loggedInPage;
    await page.goto(`/conversas/${channel.id}`);
    const canais = page.getByRole("region", { name: "Canais" });
    const toggle = canais.getByRole("button", { name: "Canais" });
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    await expect(canais.getByRole("link", { name: channel.name })).toBeVisible();

    // 1. Clicar no título: a seção recolhe
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await expect(canais.getByRole("link", { name: channel.name })).toBeHidden();

    // 2. Enter no título, pelo teclado: a seção expande
    await toggle.focus();
    await page.keyboard.press("Enter");
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    await expect(canais.getByRole("link", { name: channel.name })).toBeVisible();
  });
});
