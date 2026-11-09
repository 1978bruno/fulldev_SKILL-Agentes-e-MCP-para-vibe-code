// spec: e2e/plano-de-testes-f01.md
// seed: e2e/seed.spec.ts
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "../fixtures";

test.describe("Acessibilidade", () => {
  test("entrar-e-home-sem-violacoes", async ({ page, person }) => {
    // 1. Abrir /entrar e analisar
    await page.goto("/entrar");
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);

    // 2. Enviar vazio e analisar a tela com os erros de validação
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page.getByText("Informe sua senha.")).toBeVisible();
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);

    // 3. Entrar e analisar a Home
    await page.getByRole("textbox", { name: "E-mail" }).fill(person.email);
    await page.getByLabel("Senha").fill(person.password);
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page.getByRole("heading", { name: "Nenhuma conversa ainda" })).toBeVisible();
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  });
});
