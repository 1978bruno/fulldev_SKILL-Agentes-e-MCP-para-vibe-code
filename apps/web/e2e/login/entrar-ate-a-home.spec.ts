// spec: e2e/plano-de-testes-f01.md
// seed: e2e/seed.spec.ts
import { expect, test } from "../fixtures";

test.describe("Entrar", () => {
  test("entrar-ate-a-home", async ({ page, person, context }) => {
    // 1. Abrir /entrar
    await page.goto("/entrar");
    await expect(page.getByRole("textbox", { name: "E-mail" })).toBeFocused();

    // 2. Preencher E-mail e Senha da Pessoa e clicar em "Entrar"
    await page.getByRole("textbox", { name: "E-mail" }).fill(person.email);
    await page.getByLabel("Senha").fill(person.password);
    await page.getByRole("button", { name: "Entrar" }).click();

    await expect(page).toHaveURL("/");
    const rail = page.getByRole("navigation", { name: "Seções" });
    await expect(rail.getByText("FC")).toBeVisible();
    await expect(rail.getByRole("link", { name: "Início" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await expect(rail.getByRole("img", { name: person.name })).toHaveText("AS");
    await expect(
      page.getByRole("complementary", { name: "Barra lateral" }),
    ).toHaveText("Full Cycle");
    await expect(
      page.getByRole("heading", { level: 1, name: "Nenhuma conversa ainda" }),
    ).toBeVisible();

    // 3. Abrir / em outra página do mesmo navegador
    const otherPage = await context.newPage();
    await otherPage.goto("/");
    await expect(otherPage).toHaveURL("/");
    await expect(
      otherPage.getByRole("heading", { name: "Nenhuma conversa ainda" }),
    ).toBeVisible();
  });
});
