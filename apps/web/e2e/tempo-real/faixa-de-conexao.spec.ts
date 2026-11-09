// spec: e2e/plano-de-testes-f03.md
// seed: e2e/seed.spec.ts
import { expect, test } from "../fixtures";
import { messageItem, readyHistory } from "../support/conversation-page";
import { sendFromComposer, waitForRealtime } from "../support/realtime";

const BANNER_TEXT = "Sem conexão em tempo real. Reconectando…";

test.describe("Faixa de conexão", () => {
  test("a faixa aparece depois de 3 s offline e some ao voltar", async ({
    loggedInPage: page,
    context,
    memberChannel,
  }) => {
    // 1. Com o Canal aberto, a rede cai
    await page.goto(`/conversas/${memberChannel.id}`);
    await waitForRealtime(page);
    await context.setOffline(true);
    const banner = page.getByRole("status").filter({ hasText: BANNER_TEXT });

    await expect(page.locator("[data-realtime]")).toHaveAttribute("data-realtime", "disconnected");
    await expect(banner).toHaveCount(0);
    await expect(banner).toBeVisible({ timeout: 6_000 });
    await expect(banner).not.toBeFocused();

    // 2. A rede volta
    await context.setOffline(false);

    await waitForRealtime(page);
    await expect(banner).toHaveCount(0);
  });

  test("uma queda curta não mostra a faixa", async ({
    loggedInPage: page,
    context,
    memberChannel,
  }) => {
    // 1. A rede cai e volta em menos de 3 s
    await page.goto(`/conversas/${memberChannel.id}`);
    await waitForRealtime(page);
    await context.setOffline(true);
    await expect(page.locator("[data-realtime]")).toHaveAttribute("data-realtime", "disconnected");
    await context.setOffline(false);

    await waitForRealtime(page);
    await page.waitForTimeout(3_500);
    await expect(page.getByText(BANNER_TEXT)).toHaveCount(0);
  });

  test("a faixa aparece quando a primeira conexão não acontece", async ({
    page,
    person,
    memberChannel,
  }) => {
    // 1. Entrar com o WebSocket sem chegar ao servidor: a conexão nunca se completa
    await page.routeWebSocket(/\/socket\.io\//, () => {});
    await page.goto("/entrar");
    await page.locator("form[data-ready]").waitFor();
    await page.getByRole("textbox", { name: "E-mail" }).fill(person.email);
    await page.getByLabel("Senha").fill(person.password);
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page).toHaveURL(`/conversas/${memberChannel.id}`, { timeout: 15_000 });

    await expect(page.getByText(BANNER_TEXT)).toBeVisible({ timeout: 6_000 });
  });

  test("durante a queda, o envio segue a F02", async ({
    loggedInPage: page,
    context,
    memberChannel,
  }) => {
    // 1. Sem rede, enviar uma Mensagem
    await page.goto(`/conversas/${memberChannel.id}`);
    await readyHistory(page, memberChannel.name);
    await context.setOffline(true);
    await sendFromComposer(page, memberChannel.name, "Sem rede");

    await expect(messageItem(page, memberChannel.name, "Sem rede")).toContainText(
      "Não foi possível enviar.",
    );
    await context.setOffline(false);
  });
});
