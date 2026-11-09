import { defineConfig, devices } from "@playwright/test";

// Roda no contêiner e2e, contra o ambiente de desenvolvimento já de pé (LLD, "Ambiente de
// desenvolvimento"). Só Chromium, em modo headless.
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  // Os testes do tempo real abrem dois navegadores cada um, e o next dev renderiza tudo sob
  // demanda: com o padrão (metade dos núcleos), a máquina satura e os testes estouram o tempo.
  workers: 6,
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
  projects: [
    {
      name: "chromium",
      testIgnore: "**/canais-publicos/**",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } },
    },
    // Criar um Canal público pela tela inclui todas as Pessoas do banco de desenvolvimento, e os
    // testes do projeto principal contam com Pessoas fora de qualquer Canal (Home vazia, primeiro
    // Canal da lista). Estes rodam depois deles, e cada um apaga os Canais que criou (plano da
    // F04-T01, "Decisões").
    {
      name: "canais-publicos",
      testMatch: "**/canais-publicos/**/*.spec.ts",
      dependencies: ["chromium"],
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } },
    },
  ],
});
