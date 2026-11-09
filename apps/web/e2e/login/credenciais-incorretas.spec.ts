// spec: e2e/plano-de-testes-f01.md
// seed: e2e/seed.spec.ts
import { expect, test } from "../fixtures";
import { waitForLoginForm } from "../support/login-page";

test.describe("Entrar", () => {
  test("credenciais-incorretas", async ({ page, person }) => {
    // 1. Abrir /entrar, preencher o E-mail da Pessoa e uma senha errada
    await page.goto("/entrar");
    await waitForLoginForm(page);
    await page.getByRole("textbox", { name: "E-mail" }).fill(person.email);
    await page.getByLabel("Senha").fill("senha-errada");

    // 2. Clicar em "Entrar", com o envio atrasado de propósito
    await page.route("**/entrar", async (route) => {
      if (route.request().method() === "POST") {
        await new Promise((resolve) => setTimeout(resolve, 600));
      }
      await route.continue();
    });
    const submit = page.getByRole("button", { name: "Entrar" });
    await submit.click();

    await expect(submit).toBeDisabled();
    await expect(submit).toHaveAttribute("aria-busy", "true");
    await expect(
      page.getByText("E-mail ou senha incorretos. Confira os dados e tente de novo."),
    ).toBeVisible();
    const password = page.getByLabel("Senha");
    await expect(password).toHaveValue("");
    await expect(password).toHaveAttribute("aria-invalid", "true");
    await expect(password).toBeFocused();
    await expect(page.getByRole("textbox", { name: "E-mail" })).toHaveValue(
      person.email,
    );
  });
});
