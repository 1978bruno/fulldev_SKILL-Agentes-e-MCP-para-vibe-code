import type { Page } from "@playwright/test";

// Um Server Action é um POST para a própria página, com o cabeçalho next-action. `handler` decide o
// que fazer com cada chamada nas páginas que `matcher` aceita; o resto segue. Devolve a função que
// desfaz a interceptação.
export async function routeServerAction(
  page: Page,
  handler: Parameters<Page["route"]>[1],
  matcher: (url: URL) => boolean = () => true,
): Promise<() => Promise<void>> {
  await page.route(matcher, async (route, request) => {
    if (request.method() === "POST" && (await request.headerValue("next-action"))) {
      return handler(route, request);
    }
    return route.fallback();
  });
  return () => page.unroute(matcher);
}
