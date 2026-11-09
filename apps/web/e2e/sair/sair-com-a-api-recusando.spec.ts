// spec: e2e/plano-de-testes-f01.md
// seed: e2e/seed.spec.ts
import { expect, test } from "../fixtures";
import { deleteSessionsOf } from "../support/database";
import { SESSION_COOKIE_NAME } from "../support/session-cookie";

test.describe("Sair", () => {
  test("sair-com-a-api-recusando", async ({ loggedInPage: page, person, context }) => {
    // 1. A Sessão some no banco antes do clique: a API vai recusar a saída com 401
    await deleteSessionsOf(person.id);

    // 2. Abrir o menu e escolher "Sair do Full Cycle"
    await page.getByRole("button", { name: `Menu de ${person.name}` }).click();
    await page.getByRole("menuitem", { name: "Sair do Full Cycle" }).click();

    await expect(page).toHaveURL("/entrar");
    const cookies = await context.cookies();
    expect(cookies.map((cookie) => cookie.name)).not.toContain(SESSION_COOKIE_NAME);
  });
});
