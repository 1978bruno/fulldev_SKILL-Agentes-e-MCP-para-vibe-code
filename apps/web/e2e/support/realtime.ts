import { expect, type Page } from "@playwright/test";

// Espera o socket da aba conectado: o provedor do tempo real marca o estado em data-realtime.
export async function waitForRealtime(page: Page): Promise<void> {
  await expect(page.locator("[data-realtime]")).toHaveAttribute("data-realtime", "connected", {
    timeout: 15_000,
  });
}

// Os WebSockets da página com a API do chat que estão abertos agora. Conta os abertos, e não os
// criados: no next dev, o modo estrito do React monta o provedor duas vezes, e o primeiro socket
// fecha logo.
export function openRealtimeSockets(page: Page): { count: () => number } {
  let open = 0;
  page.on("websocket", (socket) => {
    if (!socket.url().includes("/socket.io/")) return;
    open += 1;
    socket.on("close", () => {
      open -= 1;
    });
  });
  return { count: () => open };
}
