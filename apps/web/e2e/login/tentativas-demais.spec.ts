// spec: e2e/plano-de-testes-f01.md
// seed: e2e/seed.spec.ts
import { expect, test } from "../fixtures";
import { waitForLoginForm } from "../support/login-page";

const TOO_MANY = "Muitas tentativas de entrar. Aguarde alguns minutos e tente de novo.";

test.describe("Erros ao entrar", () => {
  test("tentativas-demais", async ({ page, person }) => {
    await page.goto("/entrar");
    await waitForLoginForm(page);
    const email = page.getByRole("textbox", { name: "E-mail" });
    const password = page.getByLabel("Senha");
    const submit = page.getByRole("button", { name: "Entrar" });

    // 1. Errar a senha 5 vezes seguidas
    await email.fill(person.email);
    for (let i = 0; i < 5; i += 1) {
      await password.fill("senha-errada");
      await submit.click();
      // O resultado chegou quando a Senha é limpa e a mensagem de dados incorretos aparece.
      await expect(password).toHaveValue("");
      await expect(page.getByText("E-mail ou senha incorretos.", { exact: false })).toBeVisible();
    }

    // 2. Tentar de novo, agora com a senha certa
    await password.fill(person.password);
    await submit.click();

    await expect(page.getByRole("alert").filter({ hasText: TOO_MANY })).toBeVisible();
    await expect(email).toHaveValue(person.email);
    await expect(password).toHaveValue(person.password);
  });
});
