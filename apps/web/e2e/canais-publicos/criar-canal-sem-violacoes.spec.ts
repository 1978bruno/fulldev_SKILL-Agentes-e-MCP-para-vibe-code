// spec: e2e/plano-de-testes-f04.md
// seed: e2e/seed.spec.ts
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "../fixtures";
import { addChannelButton, createChannelDialog } from "../support/create-channel-dialog";

test.describe("Acessibilidade", () => {
  test("criar-canal-sem-violacoes", async ({ page, memberChannel: channel, loggedInPage }) => {
    void loggedInPage;

    // 1. O diálogo aberto, vazio
    await addChannelButton(page).click();
    const dialog = createChannelDialog(page);
    await expect(dialog).toBeVisible();
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);

    // 2. O diálogo com o erro no nome
    await dialog.getByRole("textbox", { name: "Nome" }).fill(channel.name);
    await dialog.getByRole("button", { name: "Criar canal" }).click();
    await expect(dialog.getByText(`Já existe um canal chamado #${channel.name}.`)).toBeVisible();
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  });
});
