// spec: e2e/plano-de-testes-f03.md
// seed: e2e/seed.spec.ts
import { expect, test } from "../fixtures";
import { messageList } from "../support/conversation-page";
import { insertChannel } from "../support/database";
import { sendFromComposer, waitForRealtime } from "../support/realtime";

test.describe("Mensagem de outra Conversa", () => {
  test("a Mensagem que chegou em outro Canal aparece ao abri-lo", async ({
    loggedInPage: page,
    person,
    otherPerson,
    otherPage,
    sharedChannel,
  }) => {
    // 1. A Pessoa fica no Canal em comum; a outra abre um segundo Canal das duas
    const second = await insertChannel([person, otherPerson], { name: `e2e-z-${person.id}` });
    await page.goto(`/conversas/${sharedChannel.id}`);
    await waitForRealtime(page);
    await otherPage.goto(`/conversas/${second.id}`);
    await waitForRealtime(otherPage);

    // 2. A outra Pessoa envia no segundo Canal, e a primeira o abre pela barra lateral
    await sendFromComposer(otherPage, second.name, "No outro Canal");
    await expect(
      messageList(otherPage, second.name).getByRole("listitem").filter({ hasText: "No outro Canal" }),
    ).toHaveCount(1);
    await page.getByRole("region", { name: "Canais" }).getByRole("link", { name: second.name }).click();

    await expect(
      messageList(page, second.name).getByRole("listitem").filter({ hasText: "No outro Canal" }),
    ).toHaveCount(1);
  });
});
