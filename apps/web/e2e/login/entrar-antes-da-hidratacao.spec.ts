// spec: e2e/plano-de-testes-f01.md
// seed: e2e/seed.spec.ts
import { expect, test } from "../fixtures";

test.describe("Entrar", () => {
  test("entrar-antes-da-hidratacao", async ({ page, person }) => {
    // 1. Abrir /entrar sem os bundles do Next: o React nunca hidrata, e o formulário fica no
    //    envio nativo (o streaming continua, pelos scripts inline da própria página)
    await page.route("**/_next/static/chunks/**", (route) => route.abort());
    await page.goto("/entrar");

    // 2. Enviar com a senha errada: volta a "Entrar" com a mensagem de dados incorretos
    await page.getByRole("textbox", { name: "E-mail" }).fill(person.email);
    await page.getByLabel("Senha").fill("senha-errada");
    await page.getByRole("button", { name: "Entrar" }).click();

    await expect(page).toHaveURL("/entrar?falha=credenciais");
    await expect(page.getByText("E-mail ou senha incorretos.", { exact: false })).toBeVisible();

    // 3. Enviar com a senha certa: o POST nativo para a Server Action entra e cai na Home
    await page.getByRole("textbox", { name: "E-mail" }).fill(person.email);
    await page.getByLabel("Senha").fill(person.password);
    await page.getByRole("button", { name: "Entrar" }).click();

    await expect(page).toHaveURL("/");
  });
});
