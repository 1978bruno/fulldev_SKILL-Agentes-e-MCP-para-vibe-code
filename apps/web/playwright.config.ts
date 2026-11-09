import { defineConfig, devices } from "@playwright/test";

// Roda no contêiner e2e, contra o ambiente de desenvolvimento já de pé (LLD, "Ambiente de
// desenvolvimento"). Só Chromium, em modo headless.
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: process.env.BASE_URL ?? "http://localhost:3000",
    trace: "retain-on-failure",
    // As horas esperadas nos testes ficam no fuso padrão (LLD, "Valores e configuração"); o teste
    // do cookie de fuso troca o fuso só para ele.
    timezoneId: "America/Sao_Paulo",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } }],
});
