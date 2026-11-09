// spec: e2e/plano-de-testes-f03.md
// seed: e2e/seed.spec.ts
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "../fixtures";
import { composer, typingNotice } from "../support/conversation-page";
import { openSharedChannel } from "../support/realtime";

test.describe("Acessibilidade", () => {
  test("digitando-sem-violacoes", async ({
    loggedInPage: page,
    otherPage,
    otherPerson,
    person,
    sharedChannel,
  }) => {
    // 1. Com o "digitando" na tela, analisar
    await openSharedChannel(page, otherPage, sharedChannel, person, { history: 0 });
    await composer(otherPage, sharedChannel.name).pressSequentially("Escrevendo");
    await expect(typingNotice(page, otherPerson.name)).toBeVisible();

    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  });
});
