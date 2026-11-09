// spec: e2e/plano-de-testes-f01.md
// seed: e2e/seed.spec.ts
import { expect, test } from "../fixtures";

test.describe("Voltar para onde ia", () => {
  for (const para of ["//outro-site", "https://outro-site", "/\\outro-site", "/\t/outro-site"]) {
    test(`para-externo-cai-na-home: ${para}`, async ({ page, person }) => {
      // 1. Abrir "Entrar" com um para que não é do próprio chat
      await page.goto(`/entrar?para=${encodeURIComponent(para)}`);

      // 2. Entrar
      await page.getByRole("textbox", { name: "E-mail" }).fill(person.email);
      await page.getByLabel("Senha").fill(person.password);
      await page.getByRole("button", { name: "Entrar" }).click();

      await expect(page).toHaveURL("/");
      await expect(page.getByRole("heading", { name: "Nenhuma conversa ainda" })).toBeVisible();
    });
  }
});
