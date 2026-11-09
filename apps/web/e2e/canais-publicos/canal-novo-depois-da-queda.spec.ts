// spec: e2e/plano-de-testes-f04.md
// seed: e2e/seed.spec.ts
import { expect, test } from "../fixtures";
import {
  addChannelButton,
  createChannelDialog,
  uniqueTypedChannelName,
} from "../support/create-channel-dialog";
import { conversationIntro } from "../support/conversation-page";
import { deleteChannelsNamed } from "../support/database";
import { deleteEventsEpoch } from "../support/redis";
import { openSharedChannel, waitForRealtime } from "../support/realtime";

test.describe("Canais novos na barra lateral", () => {
  test("o reset recarrega a lista e traz o Canal criado durante a queda", async ({
    loggedInPage: page,
    otherPage,
    person,
    sharedChannel,
  }) => {
    const { name } = uniqueTypedChannelName();
    try {
      // 1. A segunda Pessoa cai, e a época dos eventos se perde
      await openSharedChannel(page, otherPage, sharedChannel, person, { history: 0 });
      await otherPage.context().setOffline(true);
      await waitForRealtime(otherPage, "disconnected");
      await deleteEventsEpoch();

      // 2. A primeira cria um Canal público durante a queda
      await addChannelButton(page).click();
      const dialog = createChannelDialog(page);
      await dialog.getByRole("textbox", { name: "Nome" }).fill(name);
      await dialog.getByRole("button", { name: "Criar canal" }).click();
      await expect(conversationIntro(page, name)).toBeVisible();

      // 3. Ao voltar, o reset busca a lista de novo, e o Canal aparece sem recarregar a página
      await otherPage.context().setOffline(false);
      await waitForRealtime(otherPage);
      await expect(
        otherPage.getByRole("navigation", { name: "Conversas" }).getByRole("link", { name }),
      ).toBeVisible();
    } finally {
      await deleteChannelsNamed([name]);
    }
  });
});
