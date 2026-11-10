// spec: e2e/plano-de-testes-f04.md
// seed: e2e/seed.spec.ts
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "../fixtures";
import { readyHistory } from "../support/conversation-page";

test.describe("Lista de Membros", () => {
  test("no Canal público não há Adicionar pessoas, e a lista não tem violações", async ({
    page,
    memberChannel: channel,
    person,
    loggedInPage,
  }) => {
    void loggedInPage;
    // 1. Abrir a lista de Membros de um Canal público
    await page.goto(`/conversas/${channel.id}`);
    await readyHistory(page, channel.name);
    await page.getByRole("button", { name: "Membros: 1" }).click();
    const dialog = page.getByRole("dialog", { name: `Membros de #${channel.name}` });

    // 2. A lista mostra a Pessoa com "(você)", sem o botão de adicionar
    await expect(dialog.getByRole("list", { name: "Membros" })).toContainText(`${person.name} (você)`);
    await expect(dialog.getByRole("button", { name: "Adicionar pessoas" })).toHaveCount(0);
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  });
});
