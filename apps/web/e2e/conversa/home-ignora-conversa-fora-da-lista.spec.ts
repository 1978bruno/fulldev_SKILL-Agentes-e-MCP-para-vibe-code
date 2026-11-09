// spec: e2e/plano-de-testes-f02.md
// seed: e2e/seed.spec.ts
import { randomUUID } from "node:crypto";
import { expect, test } from "../fixtures";
import { insertChannel } from "../support/database";
import { lastConversationCookie } from "../support/session-cookie";

test.describe("Canal ao entrar", () => {
  test("home-ignora-conversa-fora-da-lista", async ({ page, person, loggedInPage, baseURL }) => {
    void loggedInPage;
    await insertChannel([person], { name: `e2e-b-${person.id}` });
    const first = await insertChannel([person], { name: `e2e-a-${person.id}` });
    // 1. Um cookie com uma Conversa que não está na lista da Pessoa
    await page.context().addCookies([lastConversationCookie(randomUUID(), baseURL!)]);

    await page.goto("/");

    await expect(page).toHaveURL(`/conversas/${first.id}`);
  });
});
