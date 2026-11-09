// spec: e2e/plano-de-testes-f03.md
// seed: e2e/seed.spec.ts
import { expect, test } from "../fixtures";
import {
  composer,
  distanceToEnd,
  messageItem,
  newMessagesPill,
  scrollAwayFromEnd,
  scrollHistoryToEnd,
} from "../support/conversation-page";
import { openSharedChannel as openBoth, sendFromComposer } from "../support/realtime";

test.describe("Pílula de novas mensagens", () => {
  test("no fim, a Mensagem que chega rola a lista", async ({
    loggedInPage: page,
    otherPage,
    person,
    sharedChannel,
  }) => {
    // 1. Com a lista no fim, a outra Pessoa envia
    const history = await openBoth(page, otherPage, sharedChannel, person);
    await sendFromComposer(otherPage, sharedChannel.name, "Chegou no fim");

    await expect(messageItem(page, sharedChannel.name, "Chegou no fim")).toBeInViewport();
    expect(await distanceToEnd(history)).toBeLessThanOrEqual(100);
    await expect(newMessagesPill(page)).toHaveCount(0);
  });

  test("lendo mais acima, a lista não se move e aparece a pílula", async ({
    loggedInPage: page,
    otherPage,
    person,
    sharedChannel,
  }) => {
    // 1. Ler mais acima e receber uma Mensagem
    const history = await openBoth(page, otherPage, sharedChannel, person);
    const position = await scrollAwayFromEnd(history);
    await sendFromComposer(otherPage, sharedChannel.name, "Chegou lá embaixo");
    const pill = newMessagesPill(page);

    await expect(pill).toBeVisible();
    expect(await history.evaluate((element) => element.scrollTop)).toBe(position);

    // 2. Clicar na pílula
    await pill.click();

    await expect(messageItem(page, sharedChannel.name, "Chegou lá embaixo")).toBeInViewport();
    await expect(pill).toHaveCount(0);
  });

  test("a pílula some ao rolar até o fim", async ({
    loggedInPage: page,
    otherPage,
    person,
    sharedChannel,
  }) => {
    // 1. Com a pílula na tela, rolar até o fim
    const history = await openBoth(page, otherPage, sharedChannel, person);
    await scrollAwayFromEnd(history);
    await sendFromComposer(otherPage, sharedChannel.name, "Outra chegada");
    const pill = newMessagesPill(page);
    await expect(pill).toBeVisible();
    await scrollHistoryToEnd(history);

    await expect(pill).toHaveCount(0);
  });

  test("a pílula pelo teclado leva ao fim", async ({
    loggedInPage: page,
    otherPage,
    person,
    sharedChannel,
  }) => {
    // 1. Com a pílula na tela, chegar a ela pelo Shift+Tab a partir da caixa e apertar Enter
    const history = await openBoth(page, otherPage, sharedChannel, person);
    await scrollAwayFromEnd(history);
    await sendFromComposer(otherPage, sharedChannel.name, "Pelo teclado");
    const pill = newMessagesPill(page);
    await expect(pill).toBeVisible();
    await composer(page, sharedChannel.name).focus();
    await page.keyboard.press("Shift+Tab");
    await expect(pill).toBeFocused();
    await page.keyboard.press("Enter");

    await expect(messageItem(page, sharedChannel.name, "Pelo teclado")).toBeInViewport();
    await expect(pill).toHaveCount(0);
    await expect(history).toBeFocused();
  });

  test("a Mensagem da própria Pessoa sempre rola até o fim", async ({
    loggedInPage: page,
    otherPage,
    person,
    sharedChannel,
  }) => {
    // 1. Ler mais acima e enviar
    const history = await openBoth(page, otherPage, sharedChannel, person);
    await scrollAwayFromEnd(history);
    await sendFromComposer(page, sharedChannel.name, "Minha, lá do alto");

    await expect(messageItem(page, sharedChannel.name, "Minha, lá do alto")).toBeInViewport();
    await expect(newMessagesPill(page)).toHaveCount(0);
  });

  test("descartar a própria Mensagem com falha não mostra a pílula", async ({
    loggedInPage: page,
    otherPage,
    person,
    sharedChannel,
  }) => {
    // 1. Um envio que falha fica no fim; ler mais acima e descartá-lo
    const history = await openBoth(page, otherPage, sharedChannel, person);
    await page.route(
      (url) => url.pathname.startsWith("/conversas/"),
      async (route, request) =>
        request.method() === "POST" && (await request.headerValue("next-action"))
          ? route.abort()
          : route.fallback(),
    );
    await sendFromComposer(page, sharedChannel.name, "Vai falhar");
    await expect(page.getByText("Não foi possível enviar.")).toBeVisible();
    await scrollAwayFromEnd(history);
    await page.getByRole("button", { name: "Descartar" }).click();

    await expect(messageItem(page, sharedChannel.name, "Vai falhar")).toHaveCount(0);
    await expect(newMessagesPill(page)).toHaveCount(0);
  });

  test("a Mensagem da própria Pessoa enviada por outra aba mostra a pílula", async ({
    loggedInPage: page,
    otherPage,
    person,
    sharedChannel,
  }) => {
    // 1. Ler mais acima numa aba e enviar pela outra aba da mesma Pessoa
    const history = await openBoth(page, otherPage, sharedChannel, person);
    const secondTab = await page.context().newPage();
    await secondTab.goto(`/conversas/${sharedChannel.id}`);
    await scrollAwayFromEnd(history);
    await sendFromComposer(secondTab, sharedChannel.name, "Da outra aba, lá embaixo");

    await expect(newMessagesPill(page)).toBeVisible();
  });
});

