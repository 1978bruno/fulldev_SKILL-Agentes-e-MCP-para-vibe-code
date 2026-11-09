// spec: e2e/plano-de-testes-f04.md
// seed: e2e/seed.spec.ts
import { randomUUIDv7 } from "node:crypto";
import { expect, logIn, test } from "../fixtures";
import { insertChannel } from "../support/database";

test.describe("Canal privado", () => {
  test("o Canal privado fica em ordem alfabética junto dos públicos, com o cadeado", async ({
    page,
    person,
  }) => {
    // 1. Um Canal privado entre dois públicos, na ordem do nome
    const suffix = randomUUIDv7().slice(-12);
    await insertChannel([person], { name: `e2e-c-${suffix}` });
    await insertChannel([person], { name: `e2e-b-${suffix}`, kind: "private_channel" });
    await insertChannel([person], { name: `e2e-a-${suffix}` });
    await logIn(page, person);

    // 2. A barra lateral mostra os três juntos, em ordem, e só o privado com o cadeado
    const links = page.getByRole("navigation", { name: "Conversas" }).getByRole("link");
    await expect(links).toHaveText([`e2e-a-${suffix}`, `e2e-b-${suffix}`, `e2e-c-${suffix}`]);
    await expect(links.nth(1).locator("svg.lucide-lock")).toBeVisible();
    await expect(links.nth(0).locator("svg.lucide-hash")).toBeVisible();
    await expect(links.nth(2).locator("svg.lucide-hash")).toBeVisible();
  });
});
