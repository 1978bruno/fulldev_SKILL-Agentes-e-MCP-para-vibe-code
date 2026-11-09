// spec: e2e/plano-de-testes-f02.md
// seed: e2e/seed.spec.ts
import { expect, test } from "../fixtures";
import { readyHistory } from "../support/conversation-page";
import { deleteSessionsOf } from "../support/database";
import { waitForRealtime } from "../support/realtime";

test.describe("Enviar uma Mensagem", () => {
  test("envio-com-sessao-revogada", async ({ page, person, memberChannel: channel, loggedInPage }) => {
    void loggedInPage;
    await page.goto(`/conversas/${channel.id}`);
    // Antes da hidratação, o Enter seria o envio nativo do formulário.
    await readyHistory(page, channel.name);
    // O socket conectado: o handshake recusado também levaria a "Entrar" no meio do teste.
    await waitForRealtime(page);
    const caixa = page.getByRole("textbox", { name: `Mensagem para #${channel.name}` });
    await expect(caixa).toBeFocused();

    // 1. Revogar a Sessão e enviar
    await deleteSessionsOf(person.id);
    await caixa.fill("Ainda estou aqui?");
    await caixa.press("Enter");

    await expect(page).toHaveURL(`/entrar?para=%2Fconversas%2F${channel.id}`);
  });
});
