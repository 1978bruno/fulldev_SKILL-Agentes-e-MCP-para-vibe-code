// spec: e2e/plano-de-testes-f03.md
// seed: e2e/seed.spec.ts
import { expect, logIn, test } from "../fixtures";
import { messageList } from "../support/conversation-page";
import { sendFromComposer, waitForRealtime } from "../support/realtime";

test.describe("Reset na conexão", () => {
  test("o reset traz a Mensagem gravada antes da conexão e mantém o texto da caixa", async ({
    page,
    person,
    otherPage,
    sharedChannel,
  }) => {
    // 1. Entrar com o WebSocket encaminhado; a partir daqui, a próxima conexão fica segurada
    let hold = false;
    let release: () => void = () => {};
    const released = new Promise<void>((resolve) => {
      release = resolve;
    });
    await page.routeWebSocket(/\/socket\.io\//, async (socket) => {
      if (hold) await released;
      socket.connectToServer();
    });
    await logIn(page, person);
    hold = true;

    // 2. Abrir o Canal (a conexão nova fica segurada) e começar a escrever
    await page.goto(`/conversas/${sharedChannel.id}`);
    const composer = page.getByRole("textbox", { name: `Mensagem para #${sharedChannel.name}` });
    await composer.fill("Rascunho que fica");

    // 3. A outra Pessoa envia antes de a conexão chegar
    await otherPage.goto(`/conversas/${sharedChannel.id}`);
    await waitForRealtime(otherPage);
    await sendFromComposer(otherPage, sharedChannel.name, "Antes da conexão");
    await expect(
      messageList(otherPage, sharedChannel.name).getByRole("listitem").filter({ hasText: "Antes da conexão" }),
    ).toHaveCount(1);

    // 4. Soltar a conexão: o sync com reset recarrega a página mais recente
    release();
    await waitForRealtime(page);

    await expect(
      messageList(page, sharedChannel.name).getByRole("listitem").filter({ hasText: "Antes da conexão" }),
    ).toHaveCount(1);
    await expect(composer).toHaveValue("Rascunho que fica");
  });
});
