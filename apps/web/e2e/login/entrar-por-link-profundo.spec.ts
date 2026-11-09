// spec: e2e/plano-de-testes-f01.md
// seed: e2e/seed.spec.ts
import { expect, test } from "../fixtures";

test.describe("Voltar para onde ia", () => {
  test("entrar-por-link-profundo", async ({ page, person }) => {
    // 1. Sem Sessão, abrir um link profundo com busca
    await page.goto("/canais/geral?aba=fixados");

    await expect(page).toHaveURL("/entrar?para=%2Fcanais%2Fgeral%3Faba%3Dfixados");

    // 2. Entrar
    await page.getByRole("textbox", { name: "E-mail" }).fill(person.email);
    await page.getByLabel("Senha").fill(person.password);
    await page.getByRole("button", { name: "Entrar" }).click();

    await expect(page).toHaveURL("/canais/geral?aba=fixados");
  });
});
