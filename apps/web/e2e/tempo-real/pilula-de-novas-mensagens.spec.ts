// spec: e2e/plano-de-testes-f03.md
// seed: e2e/seed.spec.ts
import type { Page } from "@playwright/test";
import { expect, test } from "../fixtures";
import {
  distanceToEnd,
  messageItem,
  readyHistory,
  scrollAwayFromEnd,
} from "../support/conversation-page";
import { insertHistory, type TestChannel, type TestPerson } from "../support/database";
import { sendFromComposer, waitForRealtime } from "../support/realtime";

// As duas Pessoas no Canal em comum, com histórico para rolar.
async function openBoth(
  page: Page,
  otherPage: Page,
  channel: TestChannel,
  person: TestPerson,
) {
  await insertHistory(channel, person, 40);
  await page.goto(`/conversas/${channel.id}`);
  await otherPage.goto(`/conversas/${channel.id}`);
  await waitForRealtime(page);
  await waitForRealtime(otherPage);
  return readyHistory(page, channel.name);
}

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
    await expect(page.getByRole("button", { name: "Novas mensagens" })).toHaveCount(0);
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
    const pill = page.getByRole("button", { name: "Novas mensagens" });

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
    const pill = page.getByRole("button", { name: "Novas mensagens" });
    await expect(pill).toBeVisible();
    await history.evaluate((element) => {
      element.scrollTop = element.scrollHeight;
    });

    await expect(pill).toHaveCount(0);
  });

  test("a pílula pelo teclado leva ao fim", async ({
    loggedInPage: page,
    otherPage,
    person,
    sharedChannel,
  }) => {
    // 1. Com a pílula na tela, chegar a ela pelo Tab e apertar Enter
    const history = await openBoth(page, otherPage, sharedChannel, person);
    await scrollAwayFromEnd(history);
    await sendFromComposer(otherPage, sharedChannel.name, "Pelo teclado");
    const pill = page.getByRole("button", { name: "Novas mensagens" });
    await expect(pill).toBeVisible();
    await history.focus();
    await page.keyboard.press("Tab");
    await expect(pill).toBeFocused();
    await page.keyboard.press("Enter");

    await expect(messageItem(page, sharedChannel.name, "Pelo teclado")).toBeInViewport();
    await expect(pill).toHaveCount(0);
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
    await expect(page.getByRole("button", { name: "Novas mensagens" })).toHaveCount(0);
  });
});
