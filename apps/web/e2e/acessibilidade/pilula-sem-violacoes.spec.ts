// spec: e2e/plano-de-testes-f03.md
// seed: e2e/seed.spec.ts
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "../fixtures";
import { newMessagesPill, scrollAwayFromEnd } from "../support/conversation-page";
import { openSharedChannel, sendFromComposer } from "../support/realtime";

test.describe("Acessibilidade", () => {
  test("pilula-sem-violacoes", async ({ loggedInPage: page, otherPage, person, sharedChannel }) => {
    // 1. Com a pílula na tela, analisar
    const history = await openSharedChannel(page, otherPage, sharedChannel, person);
    await scrollAwayFromEnd(history);
    await sendFromComposer(otherPage, sharedChannel.name, "Para a pílula");
    await expect(newMessagesPill(page)).toBeVisible();

    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  });
});
