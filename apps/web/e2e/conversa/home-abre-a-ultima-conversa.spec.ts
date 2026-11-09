// spec: e2e/plano-de-testes-f02.md
// seed: e2e/seed.spec.ts
import { expect, test } from "../fixtures";
import { readyHistory } from "../support/conversation-page";
import { insertChannel } from "../support/database";
import { browserCookie, LAST_CONVERSATION_COOKIE } from "../support/session-cookie";

test.describe("Canal ao entrar", () => {
  test("home-abre-a-ultima-conversa", async ({ page, person, loggedInPage }) => {
    void loggedInPage;
    const second = await insertChannel([person], { name: `e2e-b-${person.id}` });
    await insertChannel([person], { name: `e2e-a-${person.id}` });

    // 1. Abrir o segundo Canal: o cookie guarda a última Conversa
    await page.goto(`/conversas/${second.id}`);
    await readyHistory(page, second.name);
    await expect
      .poll(() => browserCookie(page, LAST_CONVERSATION_COOKIE))
      .toMatchObject({ value: second.id, path: "/", sameSite: "Lax" });
    const cookie = (await browserCookie(page, LAST_CONVERSATION_COOKIE))!;
    const days = (cookie.expires * 1000 - Date.now()) / 86_400_000;
    expect(days).toBeGreaterThan(399);

    // 2. Abrir a Home: volta para o segundo, e não para o primeiro da lista
    await page.goto("/");

    await expect(page).toHaveURL(`/conversas/${second.id}`);
  });
});
