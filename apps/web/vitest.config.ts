import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Vitest só para as funções puras com muitos casos (LLD, "Estrutura do código"), em Node. Os
// fluxos ficam no Playwright, em e2e/, que esta suíte não lê.
export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
