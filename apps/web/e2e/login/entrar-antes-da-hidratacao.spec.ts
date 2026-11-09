// spec: e2e/plano-de-testes-f01.md
// seed: e2e/seed.spec.ts
import { expect, test } from "../fixtures";

test.describe("Entrar", () => {
  test("entrar-antes-da-hidratacao", async ({ page, person }) => {
    // 1. Abrir /entrar sem os bundles do Next: o React nunca hidrata, e o formulário fica no
    //    envio nativo (o streaming continua, pelos scripts inline da própria página)
    await page.route("**/_next/static/chunks/**", (route) => route.abort());
    await page.goto("/entrar");
    await page.getByRole("textbox", { name: "E-mail" }).fill(person.email);
    await page.getByLabel("Senha").fill(person.password);
    await page.getByRole("button", { name: "Entrar" }).click();

    // O envio nativo é um POST para a Server Action: entra e cai na Home, sem a senha na URL.
    await expect(page).toHaveURL("/");
  });
});
