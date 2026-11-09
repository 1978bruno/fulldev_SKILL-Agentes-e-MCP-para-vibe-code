// spec: e2e/plano-de-testes-f03.md
// seed: e2e/seed.spec.ts
import { expect, test } from "../fixtures";
import { composer, typingNotice } from "../support/conversation-page";
import { openSharedChannel } from "../support/realtime";

test.describe("Digitando", () => {
  test("mostra quem digita e some ao enviar", async ({
    loggedInPage: page,
    otherPage,
    otherPerson,
    person,
    sharedChannel,
  }) => {
    // 1. A outra Pessoa escreve sem enviar
    await openSharedChannel(page, otherPage, sharedChannel, person, { history: 0 });
    const box = composer(otherPage, sharedChannel.name);
    await box.pressSequentially("Já respondo");
    const typing = typingNotice(page, otherPerson.name);

    await expect(typing).toBeVisible();

    // 2. Ela envia
    await box.press("Enter");

    await expect(typing).toHaveCount(0);
  });

  test("some depois de 5 s sem digitar", async ({
    loggedInPage: page,
    otherPage,
    otherPerson,
    person,
    sharedChannel,
  }) => {
    // 1. A outra Pessoa escreve e para
    await openSharedChannel(page, otherPage, sharedChannel, person, { history: 0 });
    await composer(otherPage, sharedChannel.name).pressSequentially("Pensando");
    const typing = typingNotice(page, otherPerson.name);
    await expect(typing).toBeVisible();

    await expect(typing).toHaveCount(0, { timeout: 8_000 });
  });

  test("não mostra a própria Pessoa", async ({
    loggedInPage: page,
    otherPage,
    person,
    sharedChannel,
  }) => {
    // 1. A Pessoa escreve numa aba, com outra aba dela aberta no mesmo Canal
    await openSharedChannel(page, otherPage, sharedChannel, person, { history: 0 });
    const secondTab = await page.context().newPage();
    await secondTab.goto(`/conversas/${sharedChannel.id}`);
    await composer(page, sharedChannel.name).pressSequentially("Só eu");

    await expect(typingNotice(otherPage, person.name)).toBeVisible();
    await expect(page.getByText("está digitando…")).toHaveCount(0);
    await expect(secondTab.getByText("está digitando…")).toHaveCount(0);
  });
});
