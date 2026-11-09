// spec: e2e/plano-de-testes-f02.md
// seed: e2e/seed.spec.ts
import { expect, test } from "../fixtures";
import { insertChannel, insertMessages, insertPerson } from "../support/database";

test.describe("Ler as Mensagens", () => {
  test("ler-as-mensagens-recentes", async ({ page, person, loggedInPage }) => {
    void loggedInPage;
    // 1. Abrir um Canal com Tópico e três Mensagens de outra Pessoa
    const bruno = await insertPerson("Bruno Lima");
    const channel = await insertChannel([person, bruno], { topic: "Conversas do time" });
    await insertMessages(channel, [
      { author: bruno, body: "Bom dia, time!", at: new Date("2026-11-09T11:40:00Z") },
      { author: bruno, body: "Staging atualizado.", at: new Date("2026-11-09T11:42:00Z") },
      { author: bruno, body: "Demo na sexta.", at: new Date("2026-11-09T11:58:00Z") },
    ]);
    await page.goto(`/conversas/${channel.id}`);

    await expect(page.getByRole("heading", { level: 1, name: channel.name })).toBeVisible();
    await expect(page.getByText("Conversas do time")).toBeVisible();
    const mensagens = page.getByRole("list", { name: `Mensagens em #${channel.name}` });
    const itens = mensagens.getByRole("listitem");
    await expect(itens).toHaveCount(3);
    await expect(itens.nth(0)).toContainText("Bruno Lima");
    await expect(itens.nth(0)).toContainText("08:40");
    await expect(itens.nth(0)).toContainText("Bom dia, time!");
    await expect(itens.nth(2)).toBeInViewport();
    await expect(page.getByRole("textbox", { name: `Mensagem para #${channel.name}` })).toBeFocused();
  });
});
