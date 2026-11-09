import { randomUUIDv7 } from "node:crypto";
import type { Locator, Page } from "@playwright/test";
import { routeServerAction } from "./server-action";

// Nome único de Canal criado pela tela, com o prefixo e2e- dos dados de teste. Digitado com
// maiúsculas e espaço, ele chega ao campo normalizado.
export function uniqueTypedChannelName(): { typed: string; name: string } {
  const suffix = randomUUIDv7().replaceAll("-", "").slice(-12);
  return { typed: `E2E Canal ${suffix}`, name: `e2e-canal-${suffix}` };
}

export function createChannelDialog(page: Page): Locator {
  return page.getByRole("dialog", { name: "Criar canal" });
}

export function addChannelButton(page: Page): Locator {
  return page
    .getByRole("navigation", { name: "Conversas" })
    .getByRole("button", { name: "Adicionar canal" });
}

// A criação é um Server Action, chamado da página em que a barra lateral está.
export function routeCreateChannel(
  page: Page,
  handler: Parameters<Page["route"]>[1],
): Promise<() => Promise<void>> {
  return routeServerAction(page, handler);
}
