// spec: e2e/plano-de-testes-f01.md
// seed: e2e/seed.spec.ts
import type { Page } from "@playwright/test";
import { expect, test } from "../fixtures";

const EMAIL_INVALID = "Informe um e-mail válido, como nome@empresa.com.";
const PASSWORD_REQUIRED = "Informe sua senha.";

function countLoginPosts(page: Page): () => number {
  let posts = 0;
  page.on("request", (request) => {
    if (request.method() === "POST" && new URL(request.url()).pathname === "/entrar") {
      posts += 1;
    }
  });
  return () => posts;
}

test.describe("Erros ao entrar", () => {
  test("erros-de-preenchimento", async ({ page }) => {
    const posts = countLoginPosts(page);

    // 1. Abrir /entrar e clicar em "Entrar" com os dois campos vazios
    await page.goto("/entrar");
    await page.getByRole("button", { name: "Entrar" }).click();

    const email = page.getByRole("textbox", { name: "E-mail" });
    const password = page.getByLabel("Senha");
    await expect(page.getByText(EMAIL_INVALID)).toBeVisible();
    await expect(page.getByText(PASSWORD_REQUIRED)).toBeVisible();
    await expect(email).toBeFocused();
    await expect(email).toHaveAttribute("aria-invalid", "true");
    await expect(email).toHaveAttribute("aria-describedby", "email-error");
    await expect(page.locator("#email-error")).toHaveText(EMAIL_INVALID);
    await expect(password).toHaveAttribute("aria-describedby", "password-error");
    await expect(page.locator("#password-error")).toHaveText(PASSWORD_REQUIRED);

    // 2. Preencher um e-mail fora do formato e uma senha, e enviar
    await email.fill("ana-sem-arroba");
    await password.fill("qualquer-senha");
    await password.press("Enter");

    await expect(page.getByText(EMAIL_INVALID)).toBeVisible();
    await expect(page.getByText(PASSWORD_REQUIRED)).toBeHidden();
    await expect(email).toBeFocused();

    // 3. Preencher um e-mail válido, apagar a senha e enviar
    await email.fill("ana@empresa.com");
    await password.fill("");
    await page.getByRole("button", { name: "Entrar" }).click();

    await expect(page.getByText(PASSWORD_REQUIRED)).toBeVisible();
    await expect(page.getByText(EMAIL_INVALID)).toBeHidden();
    await expect(password).toBeFocused();
    await expect(password).toHaveAttribute("aria-invalid", "true");
    expect(posts()).toBe(0);
  });
});
