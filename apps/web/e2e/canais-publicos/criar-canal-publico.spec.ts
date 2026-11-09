// spec: e2e/plano-de-testes-f04.md
// seed: e2e/seed.spec.ts
import { expect, test } from "../fixtures";
import {
  addChannelButton,
  createChannelDialog,
  uniqueTypedChannelName,
} from "../support/create-channel-dialog";
import { conversationIntro } from "../support/conversation-page";
import { countChannelsNamed, deleteChannelsNamed } from "../support/database";

test.describe("Criar um Canal público", () => {
  const created: string[] = [];
  test.afterEach(async () => {
    await deleteChannelsNamed(created.splice(0));
  });

  test("cria o Canal pelo teclado e cai nele", async ({ page, loggedInPage }) => {
    void loggedInPage;
    const { typed, name } = uniqueTypedChannelName();
    created.push(name);

    // 1. "Adicionar canal" pelo teclado abre o diálogo com o foco no nome
    await addChannelButton(page).focus();
    await page.keyboard.press("Enter");
    const dialog = createChannelDialog(page);
    const nameField = dialog.getByRole("textbox", { name: "Nome" });
    await expect(nameField).toBeFocused();

    // 2. O nome digitado com maiúsculas, espaços e símbolo chega normalizado
    await page.keyboard.type(`${typed}!`);
    await expect(nameField).toHaveValue(name);

    // 3. O Tópico e o Enter criam o Canal, que abre vazio, com o foco na caixa de mensagem
    await page.keyboard.press("Tab");
    await page.keyboard.type("Metas e prioridades do trimestre");
    await page.keyboard.press("Enter");
    await expect(dialog).toHaveCount(0);
    await expect(page).toHaveURL(/\/conversas\/[0-9a-f-]{36}$/);
    await expect(conversationIntro(page, name)).toBeVisible();
    await expect(page.getByText("Metas e prioridades do trimestre").last()).toBeVisible();
    await expect(page.getByRole("textbox", { name: `Mensagem para #${name}` })).toBeFocused();
    await expect(
      page.getByRole("navigation", { name: "Conversas" }).getByRole("link", { name }),
    ).toBeVisible();
    expect(await countChannelsNamed(name)).toBe(1);
  });

  test("Esc fecha sem criar", async ({ page, loggedInPage }) => {
    void loggedInPage;
    const { typed, name } = uniqueTypedChannelName();

    // 1. Abrir o diálogo e preencher o nome
    await addChannelButton(page).click();
    const dialog = createChannelDialog(page);
    await dialog.getByRole("textbox", { name: "Nome" }).fill(typed);

    // 2. Esc fecha e devolve o foco a "Adicionar canal"
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    await expect(addChannelButton(page)).toBeFocused();
    expect(await countChannelsNamed(name)).toBe(0);

    // 3. Abrir de novo começa com o formulário vazio
    await addChannelButton(page).click();
    await expect(dialog.getByRole("textbox", { name: "Nome" })).toHaveValue("");
  });

  test("o nome repetido aparece no campo", async ({ page, memberChannel: channel, loggedInPage }) => {
    void loggedInPage;

    // 1. Tentar criar um Canal com o nome de um que já existe
    await addChannelButton(page).click();
    const dialog = createChannelDialog(page);
    const nameField = dialog.getByRole("textbox", { name: "Nome" });
    await nameField.fill(channel.name);
    await dialog.getByRole("button", { name: "Criar canal" }).click();

    // 2. O erro aparece no campo, e o diálogo continua aberto
    await expect(dialog.getByText(`Já existe um canal chamado #${channel.name}.`)).toBeVisible();
    await expect(nameField).toHaveAttribute("aria-invalid", "true");
    expect(await countChannelsNamed(channel.name)).toBe(1);
  });
});
