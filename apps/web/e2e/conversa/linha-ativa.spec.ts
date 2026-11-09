// spec: e2e/plano-de-testes-f02.md
// seed: e2e/seed.spec.ts
import { expect, test } from "../fixtures";
import { readyHistory } from "../support/conversation-page";
import { insertChannel } from "../support/database";

test.describe("Barra lateral", () => {
  test("linha-ativa", async ({ page, person, loggedInPage }) => {
    void loggedInPage;
    const second = await insertChannel([person], { name: `e2e-b-${person.id}` });
    const first = await insertChannel([person], { name: `e2e-a-${person.id}` });
    const canais = page.getByRole("region", { name: "Canais" });
    const row = (name: string) => canais.getByRole("link", { name });

    // 1. Abrir o primeiro: só a linha dele fica ativa
    await page.goto(`/conversas/${first.id}`);
    await readyHistory(page, first.name);
    await expect(row(first.name)).toHaveAttribute("aria-current", "page");
    await expect(row(second.name)).not.toHaveAttribute("aria-current");

    // 2. Trocar para o segundo pela barra lateral
    await row(second.name).click();
    await readyHistory(page, second.name);
    await expect(row(second.name)).toHaveAttribute("aria-current", "page");
    await expect(row(first.name)).not.toHaveAttribute("aria-current");

    // 3. Voltar no navegador
    await page.goBack();
    await expect(page).toHaveURL(`/conversas/${first.id}`);
    await expect(row(first.name)).toHaveAttribute("aria-current", "page");
    await expect(row(second.name)).not.toHaveAttribute("aria-current");
  });
});
