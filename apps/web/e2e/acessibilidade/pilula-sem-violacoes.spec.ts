// spec: e2e/plano-de-testes-f03.md
// seed: e2e/seed.spec.ts
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "../fixtures";
import { readyHistory, scrollAwayFromEnd } from "../support/conversation-page";
import { insertHistory } from "../support/database";
import { sendFromComposer, waitForRealtime } from "../support/realtime";

test.describe("Acessibilidade", () => {
  test("pilula-sem-violacoes", async ({ loggedInPage: page, otherPage, person, sharedChannel }) => {
    // 1. Com a pílula na tela, analisar
    await insertHistory(sharedChannel, person, 40);
    await page.goto(`/conversas/${sharedChannel.id}`);
    await otherPage.goto(`/conversas/${sharedChannel.id}`);
    await waitForRealtime(otherPage);
    await scrollAwayFromEnd(await readyHistory(page, sharedChannel.name));
    await sendFromComposer(otherPage, sharedChannel.name, "Para a pílula");
    await expect(page.getByRole("button", { name: "Novas mensagens" })).toBeVisible();

    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  });
});
