// spec: e2e/plano-de-testes-f03.md
// seed: e2e/seed.spec.ts
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "../fixtures";
import { waitForRealtime } from "../support/realtime";

test.describe("Acessibilidade", () => {
  test("faixa-de-conexao-sem-violacoes", async ({ loggedInPage: page, context, memberChannel }) => {
    // 1. Com a faixa na tela, analisar
    await page.goto(`/conversas/${memberChannel.id}`);
    await waitForRealtime(page);
    await context.setOffline(true);
    await expect(page.getByText("Sem conexão em tempo real. Reconectando…")).toBeVisible({
      timeout: 6_000,
    });

    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    await context.setOffline(false);
  });
});
