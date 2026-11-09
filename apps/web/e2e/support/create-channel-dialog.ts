import { randomUUIDv7 } from "node:crypto";
import type { Locator, Page } from "@playwright/test";

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

// A criação é um Server Action: um POST para a própria página, com o cabeçalho next-action.
export async function routeCreateChannel(
  page: Page,
  handler: Parameters<Page["route"]>[1],
): Promise<() => Promise<void>> {
  const matcher = () => true;
  await page.route(matcher, async (route, request) => {
    if (request.method() === "POST" && (await request.headerValue("next-action"))) {
      return handler(route, request);
    }
    return route.fallback();
  });
  return () => page.unroute(matcher);
}
