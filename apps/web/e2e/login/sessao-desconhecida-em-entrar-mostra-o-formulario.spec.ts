// spec: e2e/plano-de-testes-f01.md
// seed: e2e/seed.spec.ts
import { expect, test } from "../fixtures";
import { SESSION_COOKIE_NAME, sessionCookie } from "../support/session-cookie";

test.describe("Sem Sessão", () => {
  test("sessao-desconhecida-em-entrar-mostra-o-formulario", async ({
    page,
    context,
    baseURL,
  }) => {
    // 1. Com um cookie de sessão que a API não conhece, abrir /entrar
    await context.addCookies([sessionCookie("token-desconhecido", baseURL!)]);
    await page.goto("/entrar");

    await expect(page).toHaveURL("/entrar");
    await expect(page.getByRole("button", { name: "Entrar" })).toBeVisible();
    const cookies = await context.cookies();
    expect(cookies.map((cookie) => cookie.name)).not.toContain(SESSION_COOKIE_NAME);
  });
});
