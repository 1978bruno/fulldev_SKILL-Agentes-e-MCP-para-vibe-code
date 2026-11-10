// spec: e2e/plano-de-testes-f04.md
// seed: e2e/seed.spec.ts
import type { Locator } from "@playwright/test";
import { expect, test } from "../fixtures";
import { createPrivateChannel } from "../support/add-people-step";
import { uniqueTypedChannelName } from "../support/create-channel-dialog";
import { composer, conversationIntro } from "../support/conversation-page";
import { deleteChannelsNamed, membersOfChannelNamed } from "../support/database";

test.describe("Adicionar Pessoas ao Canal privado", () => {
  const ways: [string, (step: Locator) => Promise<void>][] = [
    ["Pular", (step) => step.getByRole("button", { name: "Pular" }).click()],
    ["Esc", (step) => step.page().keyboard.press("Escape")],
    ["o X", (step) => step.getByRole("button", { name: "Fechar" }).click()],
  ];
  for (const [how, close] of ways) {
    test(`${how} abre o Canal só com quem o criou`, async ({ page, person, loggedInPage }) => {
      void loggedInPage;
      const { name } = uniqueTypedChannelName();
      try {
        const step = await createPrivateChannel(page, name);

        await close(step);

        await expect(step).toHaveCount(0);
        await expect(conversationIntro(page, name)).toBeVisible();
        await expect(composer(page, name)).toBeFocused();
        expect(await membersOfChannelNamed(name)).toEqual([person.id]);
      } finally {
        await deleteChannelsNamed([name]);
      }
    });
  }
});
