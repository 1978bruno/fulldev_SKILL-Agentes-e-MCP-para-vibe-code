// spec: e2e/plano-de-testes-f02.md
// seed: e2e/seed.spec.ts
import { expect, test } from "../fixtures";
import { insertChannel } from "../support/database";

test.describe("Abrir um Canal", () => {
  test("abrir-canal-pela-barra-lateral", async ({ page, person, loggedInPage }) => {
    void loggedInPage;
    // 1. Com dois Canais, abrir a Home
    const second = await insertChannel([person], { name: `e2e-b-${person.id}` });
    const first = await insertChannel([person], { name: `e2e-a-${person.id}` });
    await page.goto("/");
    await expect(page).toHaveURL(`/conversas/${first.id}`);

    const canais = page.getByRole("region", { name: "Canais" });
    await expect(canais.getByRole("link")).toHaveText([first.name, second.name]);
    const barra = page.getByRole("complementary", { name: "Barra lateral" });
    await expect(barra.getByText("Adicionar canal")).toHaveCount(0);
    await expect(barra.getByText("Mensagens diretas")).toHaveCount(0);
    await expect(barra.getByText("Agentes")).toHaveCount(0);

    // 2. Clicar no segundo Canal
    await canais.getByRole("link", { name: second.name }).click();

    await expect(page).toHaveURL(`/conversas/${second.id}`);
    await expect(page.getByRole("heading", { level: 1, name: second.name })).toBeVisible();
  });
});
