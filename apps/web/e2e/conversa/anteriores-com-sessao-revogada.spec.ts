// spec: e2e/plano-de-testes-f02.md
// seed: e2e/seed.spec.ts
import { expect, test } from "../fixtures";
import { readyHistory, scrollHistoryToTop } from "../support/conversation-page";
import { deleteSessionsOf, insertHistory } from "../support/database";

test.describe("Histórico até a primeira Mensagem", () => {
  test("anteriores-com-sessao-revogada", async ({
    page,
    person,
    memberChannel: channel,
    loggedInPage,
  }) => {
    void loggedInPage;
    await insertHistory(channel, person, 60);
    await page.goto(`/conversas/${channel.id}`);
    await expect(
      page.getByRole("list", { name: `Mensagens em #${channel.name}` }).getByRole("listitem"),
    ).toHaveCount(50);

    // 1. Revogar a Sessão e rolar até o topo
    await deleteSessionsOf(person.id);
    await scrollHistoryToTop(await readyHistory(page, channel.name));

    await expect(page).toHaveURL(`/entrar?para=%2Fconversas%2F${channel.id}`);
  });
});
