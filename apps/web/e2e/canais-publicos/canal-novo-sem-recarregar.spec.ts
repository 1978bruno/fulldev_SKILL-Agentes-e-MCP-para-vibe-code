// spec: e2e/plano-de-testes-f04.md
// seed: e2e/seed.spec.ts
import { expect, test } from "../fixtures";
import {
  addChannelButton,
  createChannelDialog,
  uniqueTypedChannelName,
} from "../support/create-channel-dialog";
import { composer, conversationIntro } from "../support/conversation-page";
import { deleteChannelsNamed } from "../support/database";
import { openSharedChannel } from "../support/realtime";

test.describe("Canais novos na barra lateral", () => {
  test("o Canal público criado por outra Pessoa aparece na barra lateral sem recarregar", async ({
    loggedInPage: page,
    otherPage,
    person,
    sharedChannel,
  }) => {
    const { name } = uniqueTypedChannelName();
    try {
      // 1. As duas Pessoas no mesmo Canal; a segunda com um rascunho na caixa de mensagem
      await openSharedChannel(page, otherPage, sharedChannel, person, { history: 0 });
      await otherPage.evaluate(() => {
        (window as Window & { notReloaded?: boolean }).notReloaded = true;
      });
      const box = composer(otherPage, sharedChannel.name);
      await box.fill("Rascunho");

      // 2. A primeira cria um Canal público
      await addChannelButton(page).click();
      const dialog = createChannelDialog(page);
      await dialog.getByRole("textbox", { name: "Nome" }).fill(name);
      await dialog.getByRole("button", { name: "Criar canal" }).click();
      await expect(conversationIntro(page, name)).toBeVisible();

      // 3. O Canal aparece na barra lateral da segunda, em ordem, sem abrir nem tirar o foco
      const links = otherPage.getByRole("navigation", { name: "Conversas" }).getByRole("link");
      await expect(links.filter({ hasText: name })).toHaveCount(1);
      const names = await links.allTextContents();
      expect(names.indexOf(name)).toBeGreaterThan(-1);
      expect(names.slice().sort((a, b) => a.localeCompare(b, "pt-BR"))).toEqual(names);
      await expect(otherPage).toHaveURL(`/conversas/${sharedChannel.id}`);
      await expect(box).toBeFocused();
      await expect(box).toHaveValue("Rascunho");
      expect(
        await otherPage.evaluate(() => (window as Window & { notReloaded?: boolean }).notReloaded),
      ).toBe(true);
    } finally {
      await deleteChannelsNamed([name]);
    }
  });
});
