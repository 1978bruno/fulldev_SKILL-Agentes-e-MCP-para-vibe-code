// spec: e2e/plano-de-testes-f03.md
// seed: e2e/seed.spec.ts
import { expect, test } from "../fixtures";
import { insertChannel } from "../support/database";
import { openRealtimeSockets, waitForRealtime } from "../support/realtime";

test.describe("Conexão em tempo real", () => {
  test("mantém um socket conectado ao trocar de Canal", async ({ page, person }) => {
    // 1. Com dois Canais, entrar e abrir o primeiro
    const sockets = openRealtimeSockets(page);
    const first = await insertChannel([person], { name: `e2e-a-${person.id}` });
    const second = await insertChannel([person], { name: `e2e-b-${person.id}` });
    await page.goto("/entrar");
    await page.locator("form[data-ready]").waitFor();
    await page.getByRole("textbox", { name: "E-mail" }).fill(person.email);
    await page.getByLabel("Senha").fill(person.password);
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page).toHaveURL(`/conversas/${first.id}`, { timeout: 15_000 });
    await waitForRealtime(page);

    // 2. Trocar de Canal pela barra lateral
    await page.getByRole("region", { name: "Canais" }).getByRole("link", { name: second.name }).click();
    await expect(page).toHaveURL(`/conversas/${second.id}`);

    await expect(page.locator("[data-realtime]")).toHaveAttribute("data-realtime", "connected");
    expect(sockets.count()).toBe(1);
  });

  test("conecta as abas de duas Pessoas no mesmo Canal", async ({
    loggedInPage: page,
    otherPage,
    sharedChannel,
  }) => {
    // 1. Cada Pessoa abre o Canal em comum
    await page.goto(`/conversas/${sharedChannel.id}`);
    await otherPage.goto(`/conversas/${sharedChannel.id}`);

    await waitForRealtime(page);
    await waitForRealtime(otherPage);
  });
});
