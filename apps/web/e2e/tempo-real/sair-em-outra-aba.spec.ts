// spec: e2e/plano-de-testes-f03.md
// seed: e2e/seed.spec.ts
import { expect, test } from "../fixtures";
import { waitForRealtime } from "../support/realtime";

test.describe("Sessão que acabou", () => {
  test("sair numa aba leva a outra a Entrar", async ({
    loggedInPage: page,
    person,
    memberChannel,
  }) => {
    // 1. O Canal aberto em duas abas da mesma Sessão
    await page.goto(`/conversas/${memberChannel.id}`);
    const otherTab = await page.context().newPage();
    await otherTab.goto(`/conversas/${memberChannel.id}`);
    await waitForRealtime(otherTab);

    // 2. Sair na primeira aba
    await page.getByRole("button", { name: `Menu de ${person.name}` }).click();
    await page.getByRole("menuitem", { name: "Sair do Full Cycle" }).click();

    await expect(otherTab).toHaveURL(
      `/entrar?para=${encodeURIComponent(`/conversas/${memberChannel.id}`)}`,
    );
  });
});
