// spec: e2e/plano-de-testes-f04.md
// seed: e2e/seed.spec.ts
import { expect, test } from "../fixtures";
import { insertChannel } from "../support/database";

test.describe("Canal privado", () => {
  test("quem não é Membro não vê o Canal privado na barra lateral nem pelo endereço", async ({
    person,
    otherPage,
  }) => {
    // 1. Um Canal privado só da primeira Pessoa
    const channel = await insertChannel([person], { kind: "private_channel" });

    // 2. A outra Pessoa não o vê na barra lateral
    await otherPage.goto("/");
    await expect(otherPage.getByRole("heading", { name: "Nenhuma conversa ainda" })).toBeVisible();
    await expect(
      otherPage.getByRole("navigation", { name: "Conversas" }).getByRole("link", { name: channel.name }),
    ).toHaveCount(0);

    // 3. Pelo endereço, vê "Conversa não encontrada"
    await otherPage.goto(`/conversas/${channel.id}`);
    await expect(otherPage.getByRole("heading", { name: "Conversa não encontrada" })).toBeVisible();
  });
});
