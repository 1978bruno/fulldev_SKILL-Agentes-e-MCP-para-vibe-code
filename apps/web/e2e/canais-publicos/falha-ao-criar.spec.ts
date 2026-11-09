// spec: e2e/plano-de-testes-f04.md
// seed: e2e/seed.spec.ts
import { expect, test } from "../fixtures";
import {
  addChannelButton,
  createChannelDialog,
  routeCreateChannel,
  uniqueTypedChannelName,
} from "../support/create-channel-dialog";
import { conversationIntro } from "../support/conversation-page";
import { countChannelsNamed, deleteChannelsNamed } from "../support/database";

test.describe("Criar um Canal público", () => {
  test("a falha mantém o que foi preenchido e a nova tentativa cria um Canal só", async ({
    page,
    loggedInPage,
  }) => {
    void loggedInPage;
    const { name } = uniqueTypedChannelName();
    try {
      // 1. A criação chega à API, mas a resposta se perde no caminho
      const restore = await routeCreateChannel(page, async (route) => {
        await route.fetch();
        await route.abort();
      });
      await addChannelButton(page).click();
      const dialog = createChannelDialog(page);
      await dialog.getByRole("textbox", { name: "Nome" }).fill(name);
      await dialog.getByRole("textbox", { name: "Tópico (opcional)" }).fill("Conversas do time");
      await dialog.getByRole("button", { name: "Criar canal" }).click();

      // 2. O diálogo mostra a falha e mantém o nome e o Tópico
      await expect(dialog.getByText("Não foi possível criar o canal. Tente de novo.")).toBeVisible();
      await expect(dialog.getByRole("textbox", { name: "Nome" })).toHaveValue(name);
      await expect(dialog.getByRole("textbox", { name: "Tópico (opcional)" })).toHaveValue(
        "Conversas do time",
      );

      // 3. Com a rede de volta, a nova tentativa leva o mesmo client_id e cai no Canal já criado
      await restore();
      await dialog.getByRole("button", { name: "Criar canal" }).click();
      await expect(conversationIntro(page, name)).toBeVisible();
      expect(await countChannelsNamed(name)).toBe(1);
    } finally {
      await deleteChannelsNamed([name]);
    }
  });
});
