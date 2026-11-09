import type { Page } from "@playwright/test";

// Espera o formulário de "Entrar" hidratar, para o clique não cair no envio do navegador.
export async function waitForLoginForm(page: Page): Promise<void> {
  await page.locator("form[data-ready]").waitFor();
}
