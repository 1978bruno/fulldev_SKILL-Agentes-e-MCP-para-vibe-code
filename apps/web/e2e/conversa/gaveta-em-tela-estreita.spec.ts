// spec: e2e/plano-de-testes-f02.md
// seed: e2e/seed.spec.ts
import { expect, test } from "../fixtures";
import { readyHistory } from "../support/conversation-page";
import { insertChannel } from "../support/database";

test.describe("Gaveta", () => {
  test("gaveta-em-tela-estreita", async ({ page, person, loggedInPage }) => {
    void loggedInPage;
    const second = await insertChannel([person], { name: `e2e-b-${person.id}` });
    const first = await insertChannel([person], { name: `e2e-a-${person.id}` });
    await page.setViewportSize({ width: 767, height: 900 });

    // 1. Em 767, a Conversa sem o Rail e a barra lateral, com o botão no cabeçalho
    await page.goto(`/conversas/${first.id}`);
    await readyHistory(page, first.name);
    const button = page.getByRole("button", { name: "Abrir navegação" });
    await expect(button).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Seções" })).toBeHidden();
    await expect(page.getByRole("complementary", { name: "Barra lateral" })).toBeHidden();

    // 2. Abrir a gaveta: o Rail e os Canais
    await button.click();
    const drawer = page.getByRole("dialog", { name: "Navegação" });
    await expect(drawer.getByRole("navigation", { name: "Seções" })).toBeVisible();
    await expect(drawer.getByRole("link", { name: second.name })).toBeVisible();

    // 3. Esc fecha, e o foco volta ao botão
    await page.keyboard.press("Escape");
    await expect(drawer).toBeHidden();
    await expect(button).toBeFocused();

    // 4. O clique fora fecha
    await button.click();
    await expect(drawer).toBeVisible();
    await page.mouse.click(700, 450);
    await expect(drawer).toBeHidden();

    // 5. Escolher outro Canal fecha a gaveta, e o foco vai para a caixa de mensagem
    await button.click();
    await drawer.getByRole("link", { name: second.name }).click();
    await expect(page).toHaveURL(`/conversas/${second.id}`);
    await expect(drawer).toBeHidden();
    await expect(page.getByRole("heading", { level: 1, name: second.name })).toBeVisible();
    await expect(page.getByRole("textbox", { name: `Mensagem para #${second.name}` })).toBeFocused();
  });

  test("sem-gaveta-em-tela-larga", async ({ page, memberChannel: channel, loggedInPage }) => {
    void loggedInPage;
    await page.goto(`/conversas/${channel.id}`);
    await readyHistory(page, channel.name);

    await expect(page.getByRole("button", { name: "Abrir navegação" })).toBeHidden();
    await expect(page.getByRole("navigation", { name: "Seções" })).toBeVisible();
    await expect(page.getByRole("complementary", { name: "Barra lateral" })).toBeVisible();
  });
});

test.describe("Gaveta", () => {
  test("gaveta-fecha-ao-alargar", async ({ page, memberChannel: channel, loggedInPage }) => {
    void loggedInPage;
    await page.setViewportSize({ width: 767, height: 900 });
    await page.goto(`/conversas/${channel.id}`);
    await readyHistory(page, channel.name);
    await page.getByRole("button", { name: "Abrir navegação" }).click();
    await expect(page.getByRole("dialog", { name: "Navegação" })).toBeVisible();

    // 1. Alargar a janela com a gaveta aberta: ela fecha, e a página segue usável
    await page.setViewportSize({ width: 1440, height: 900 });

    await expect(page.getByRole("dialog", { name: "Navegação" })).toBeHidden();
    const composer = page.getByRole("textbox", { name: `Mensagem para #${channel.name}` });
    await composer.click();
    await expect(composer).toBeFocused();
  });
});
