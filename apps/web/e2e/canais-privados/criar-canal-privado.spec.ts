// spec: e2e/plano-de-testes-f04.md
// seed: e2e/seed.spec.ts
import { expect, test } from "../fixtures";
import {
  addChannelButton,
  createChannelDialog,
  uniqueTypedChannelName,
} from "../support/create-channel-dialog";
import { conversationIntro } from "../support/conversation-page";
import { deleteChannelsNamed, membersOfChannelNamed } from "../support/database";

test.describe("Canal privado", () => {
  test("cria o Canal privado pelo Switch e cai nele", async ({ page, person, loggedInPage }) => {
    void loggedInPage;
    const { name } = uniqueTypedChannelName();
    try {
      // 1. Preencher o nome e ligar "Tornar privado" pelo teclado
      await addChannelButton(page).click();
      const dialog = createChannelDialog(page);
      await dialog.getByRole("textbox", { name: "Nome" }).fill(name);
      const privateSwitch = dialog.getByRole("switch", { name: "Tornar privado" });
      await privateSwitch.focus();
      await page.keyboard.press("Space");
      await expect(privateSwitch).toBeChecked();

      // 2. Criar e pular o passo de adicionar: a Conversa abre com o cadeado no cabeçalho, no
      // começo e na barra lateral
      await dialog.getByRole("button", { name: "Criar canal" }).click();
      await page
        .getByRole("dialog", { name: `Adicionar pessoas ao #${name}` })
        .getByRole("button", { name: "Pular" })
        .click();
      await expect(conversationIntro(page, name)).toBeVisible();
      await expect(
        conversationIntro(page, name).locator("xpath=..").locator("svg.lucide-lock"),
      ).toBeVisible();
      await expect(page.getByRole("heading", { level: 1, name }).locator("svg.lucide-lock")).toBeVisible();
      await expect(
        page
          .getByRole("navigation", { name: "Conversas" })
          .getByRole("link", { name })
          .locator("svg.lucide-lock"),
      ).toBeVisible();

      // 3. Só quem criou é Membro
      expect(await membersOfChannelNamed(name)).toEqual([person.id]);
    } finally {
      await deleteChannelsNamed([name]);
    }
  });
});
