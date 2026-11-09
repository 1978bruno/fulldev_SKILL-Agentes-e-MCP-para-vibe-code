// spec: e2e/plano-de-testes-f03.md
// seed: e2e/seed.spec.ts
import type { WebSocketRoute } from "@playwright/test";
import { expect, logIn, test } from "../fixtures";
import { deleteSessionsOf } from "../support/database";
import { waitForRealtime } from "../support/realtime";

test.describe("Sessão no WebSocket", () => {
  test("vai para Entrar quando o handshake recusa a Sessão", async ({
    page,
    person,
    memberChannel,
  }) => {
    // 1. Encaminhar o WebSocket ao servidor, guardando a conexão, e entrar: a Home abre o Canal
    let current: WebSocketRoute | undefined;
    await page.routeWebSocket(/\/socket\.io\//, (socket) => {
      current = socket;
      socket.connectToServer();
    });
    await logIn(page, person);
    await expect(page).toHaveURL(`/conversas/${memberChannel.id}`);
    await waitForRealtime(page);

    // 2. Revogar a Sessão e derrubar a conexão: a reconexão refaz o handshake
    await deleteSessionsOf(person.id);
    await current?.close();

    await expect(page).toHaveURL(`/entrar?para=${encodeURIComponent(`/conversas/${memberChannel.id}`)}`, {
      timeout: 15_000,
    });
  });
});
