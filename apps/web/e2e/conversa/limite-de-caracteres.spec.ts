// spec: e2e/plano-de-testes-f02.md
// seed: e2e/seed.spec.ts
import { expect, test } from "../fixtures";
import { messageList, readyHistory } from "../support/conversation-page";

test.describe("Enviar uma Mensagem", () => {
  test("limite-de-caracteres", async ({ page, memberChannel: channel, loggedInPage }) => {
    void loggedInPage;
    await page.goto(`/conversas/${channel.id}`);
    await readyHistory(page, channel.name);
    const caixa = page.getByRole("textbox", { name: `Mensagem para #${channel.name}` });
    const enviar = page.getByRole("button", { name: "Enviar mensagem" });

    // 1. Com a caixa vazia, o envio fica desabilitado
    await expect(enviar).toBeDisabled();

    // 2. Um caractere acima do limite, contado em pontos de código
    await caixa.fill("😀".repeat(4001));
    await expect(page.getByText("1 caractere acima do limite")).toBeVisible();
    await expect(enviar).toBeDisabled();
    await caixa.press("Enter");
    await expect(messageList(page, channel.name).getByRole("listitem")).toHaveCount(0);

    // 3. Dez acima, e de volta ao limite
    await caixa.fill("a".repeat(4010));
    await expect(page.getByText("10 caracteres acima do limite")).toBeVisible();
    await caixa.fill("a".repeat(4000));
    await expect(page.getByText(/acima do limite/)).toHaveCount(0);
    await expect(enviar).toBeEnabled();
  });
});
