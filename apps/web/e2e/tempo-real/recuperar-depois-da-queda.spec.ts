// spec: e2e/plano-de-testes-f03.md
// seed: e2e/seed.spec.ts
import { expect, test } from "../fixtures";
import { composer, messageItem } from "../support/conversation-page";
import { deleteEventsEpoch } from "../support/redis";
import { openSharedChannel, sendFromComposer, waitForRealtime } from "../support/realtime";

test.describe("Recuperar depois da queda", () => {
  test("a Mensagem da queda curta aparece uma vez, sem recarregar", async ({
    loggedInPage: page,
    context,
    otherPage,
    person,
    sharedChannel,
  }) => {
    // 1. Com o Canal aberto, marcar a página e cair
    await openSharedChannel(page, otherPage, sharedChannel, person, { history: 0 });
    await page.evaluate(() => {
      (window as Window & { notReloaded?: boolean }).notReloaded = true;
    });
    await context.setOffline(true);
    await waitForRealtime(page, "disconnected");

    // 2. A outra Pessoa envia durante a queda, e a rede volta
    await sendFromComposer(otherPage, sharedChannel.name, "Durante a queda");
    await expect(messageItem(otherPage, sharedChannel.name, "Durante a queda")).toHaveCount(1);
    await context.setOffline(false);

    await waitForRealtime(page);
    await expect(messageItem(page, sharedChannel.name, "Durante a queda")).toHaveCount(1);
    expect(
      await page.evaluate(() => (window as Window & { notReloaded?: boolean }).notReloaded),
    ).toBe(true);
  });

  test("com a época apagada, recarrega as mais recentes e mantém o texto", async ({
    loggedInPage: page,
    context,
    otherPage,
    person,
    sharedChannel,
  }) => {
    // 1. Com o Canal aberto e um rascunho, cair e apagar a época dos eventos
    await openSharedChannel(page, otherPage, sharedChannel, person, { history: 0 });
    const box = composer(page, sharedChannel.name);
    await box.fill("Rascunho da queda");
    await context.setOffline(true);
    await waitForRealtime(page, "disconnected");
    await deleteEventsEpoch();

    // 2. A outra Pessoa envia, e a rede volta
    await sendFromComposer(otherPage, sharedChannel.name, "Depois da época");
    await expect(messageItem(otherPage, sharedChannel.name, "Depois da época")).toHaveCount(1);
    await context.setOffline(false);

    await waitForRealtime(page);
    await expect(messageItem(page, sharedChannel.name, "Depois da época")).toHaveCount(1);
    await expect(box).toHaveValue("Rascunho da queda");
  });
});
