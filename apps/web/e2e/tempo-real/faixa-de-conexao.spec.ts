// spec: e2e/plano-de-testes-f03.md
// seed: e2e/seed.spec.ts
import { expect, logIn, test } from "../fixtures";
import { messageItem, readyHistory } from "../support/conversation-page";
import { connectionBanner, sendFromComposer, waitForRealtime } from "../support/realtime";

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
    const banner = connectionBanner(page);

    await waitForRealtime(page, "disconnected");
    // Quase o atraso inteiro sem conexão, e ainda sem faixa.
    await page.waitForTimeout(2_500);
    await expect(banner).toHaveCount(0);
    await expect(banner).toBeVisible({ timeout: 2_000 });
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
    // 1. A rede cai e fica fora quase o atraso inteiro, sem faixa; depois volta
    await page.goto(`/conversas/${memberChannel.id}`);
    await waitForRealtime(page);
    await context.setOffline(true);
    await waitForRealtime(page, "disconnected");
    await page.waitForTimeout(2_500);
    await expect(connectionBanner(page)).toHaveCount(0);
    await context.setOffline(false);

    await waitForRealtime(page);
    await expect(connectionBanner(page)).toHaveCount(0);
  });

  test("a faixa aparece quando a primeira conexão não acontece", async ({
    page,
    person,
    memberChannel,
  }) => {
    // 1. Entrar com o WebSocket sem chegar ao servidor: a conexão nunca se completa
    await page.routeWebSocket(/\/socket\.io\//, () => {});
    await logIn(page, person, { waitForRealtime: false });
    await expect(page).toHaveURL(`/conversas/${memberChannel.id}`);

    await expect(connectionBanner(page)).toBeVisible({ timeout: 6_000 });
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
