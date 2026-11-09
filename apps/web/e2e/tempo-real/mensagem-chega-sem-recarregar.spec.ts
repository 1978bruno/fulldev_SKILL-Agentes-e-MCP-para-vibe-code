// spec: e2e/plano-de-testes-f03.md
// seed: e2e/seed.spec.ts
import { expect, test } from "../fixtures";
import { messageItem } from "../support/conversation-page";
import { sendFromComposer, waitForRealtime } from "../support/realtime";

test.describe("Mensagens chegando sem recarregar", () => {
  test("a Mensagem da outra Pessoa aparece sem recarregar", async ({
    loggedInPage: page,
    otherPage,
    otherPerson,
    sharedChannel,
  }) => {
    // 1. As duas Pessoas abrem o Canal em comum
    await page.goto(`/conversas/${sharedChannel.id}`);
    await otherPage.goto(`/conversas/${sharedChannel.id}`);
    await waitForRealtime(page);
    await waitForRealtime(otherPage);

    // 2. A outra Pessoa envia uma Mensagem
    await sendFromComposer(otherPage, sharedChannel.name, "Chegou sem recarregar");

    const item = messageItem(page, sharedChannel.name, "Chegou sem recarregar");
    await expect(item).toHaveCount(1);
    await expect(item).toContainText(otherPerson.name);
  });

  test("a Mensagem enviada por outra aba aparece uma vez só", async ({
    loggedInPage: page,
    memberChannel,
  }) => {
    // 1. A mesma Pessoa abre o Canal em duas abas
    await page.goto(`/conversas/${memberChannel.id}`);
    const secondTab = await page.context().newPage();
    await secondTab.goto(`/conversas/${memberChannel.id}`);
    await waitForRealtime(page);
    await waitForRealtime(secondTab);

    // 2. Enviar pela segunda aba
    await sendFromComposer(secondTab, memberChannel.name, "Da outra aba");

    const inFirst = messageItem(page, memberChannel.name, "Da outra aba");
    await expect(inFirst).toHaveCount(1);
    const inSecond = messageItem(secondTab, memberChannel.name, "Da outra aba");
    await expect(inSecond).toHaveCount(1);
    await expect(inSecond).not.toContainText("Enviando");
  });
});
