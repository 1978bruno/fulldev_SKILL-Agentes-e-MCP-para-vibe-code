// spec: e2e/plano-de-testes-f02.md
// seed: e2e/seed.spec.ts
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "../fixtures";
import { readyHistory } from "../support/conversation-page";

test.describe("Acessibilidade", () => {
  test("gaveta-sem-violacoes", async ({ page, memberChannel: channel, loggedInPage }) => {
    void loggedInPage;
    // 1. Em 767, abrir a gaveta e analisar
    await page.setViewportSize({ width: 767, height: 900 });
    await page.goto(`/conversas/${channel.id}`);
    await readyHistory(page, channel.name);
    await page.getByRole("button", { name: "Abrir navegação" }).click();
    await expect(page.getByRole("dialog", { name: "Navegação" })).toBeVisible();

    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  });
});
