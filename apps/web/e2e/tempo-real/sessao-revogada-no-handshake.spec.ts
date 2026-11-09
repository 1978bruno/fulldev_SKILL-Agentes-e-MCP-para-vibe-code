// spec: e2e/plano-de-testes-f03.md
// seed: e2e/seed.spec.ts
import type { WebSocketRoute } from "@playwright/test";
import { expect, test } from "../fixtures";
import { deleteSessionsOf } from "../support/database";
import { waitForRealtime } from "../support/realtime";

test.describe("Sessão no WebSocket", () => {
  test("vai para Entrar quando o handshake recusa a Sessão", async ({
    page,
    person,
    memberChannel,
    loggedInPage,
  }) => {
    void loggedInPage;
    // 1. Com o Canal aberto, encaminhar o WebSocket ao servidor, guardando a conexão
    let current: WebSocketRoute | undefined;
    await page.routeWebSocket(/\/socket\.io\//, (socket) => {
      current = socket;
      socket.connectToServer();
    });
    await page.goto(`/conversas/${memberChannel.id}`);
    await waitForRealtime(page);

    // 2. Revogar a Sessão e derrubar a conexão: a reconexão refaz o handshake
    await deleteSessionsOf(person.id);
    await current?.close();

    await expect(page).toHaveURL(`/entrar?para=${encodeURIComponent(`/conversas/${memberChannel.id}`)}`, {
      timeout: 15_000,
    });
  });
});
