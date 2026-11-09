import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Saídas do Playwright:
    "test-results/**",
    "playwright-report/**",
  ]),
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/app/config/**"],
    rules: {
      "no-restricted-properties": [
        "error",
        {
          object: "process",
          property: "env",
          message: "Leia o ambiente só em src/app/config/.",
        },
      ],
    },
  },
]);

export default eslintConfig;
