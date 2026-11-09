// spec: e2e/plano-de-testes-f02.md
// seed: e2e/seed.spec.ts
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "../fixtures";
import { messageList } from "../support/conversation-page";
import { insertChannel, insertMessages, insertPerson } from "../support/database";

test.describe("Acessibilidade", () => {
  test("conversa-sem-violacoes", async ({ page, person, loggedInPage }) => {
    void loggedInPage;
    // 1. Abrir um Canal com Mensagens e analisar
    const bruno = await insertPerson("Bruno Lima");
    const channel = await insertChannel([person, bruno]);
    await insertMessages(channel, [
      { author: bruno, body: "Bom dia, time!", at: new Date("2026-11-09T11:40:00Z") },
      { author: person, body: "Bom dia!", at: new Date("2026-11-09T11:41:00Z") },
    ]);
    await page.goto(`/conversas/${channel.id}`);
    await expect(messageList(page, channel.name)).toBeVisible();

    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  });
});
