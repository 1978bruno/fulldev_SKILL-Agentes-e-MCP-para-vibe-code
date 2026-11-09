// spec: e2e/plano-de-testes-f01.md
// seed: e2e/seed.spec.ts
import { expect, test } from "../fixtures";
import { SESSION_COOKIE_NAME, sessionCookie } from "../support/session-cookie";

test.describe("Sem Sessão", () => {
  test("sessao-desconhecida-volta-para-entrar", async ({ page, context, baseURL }) => {
    // 1. Com um cookie de sessão cujo token a API não conhece, abrir uma tela logada com busca
    await context.addCookies([sessionCookie("token-desconhecido", baseURL!)]);
    await page.goto("/?aba=fixados");

    await expect(page).toHaveURL("/entrar?para=%2F%3Faba%3Dfixados");
    const cookies = await context.cookies();
    expect(cookies.map((cookie) => cookie.name)).not.toContain(SESSION_COOKIE_NAME);
  });
});
