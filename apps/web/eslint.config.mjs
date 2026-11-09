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
    // As fixtures do Playwright chamam `use`, que não é o hook do React.
    files: ["e2e/**/*.ts"],
    rules: { "react-hooks/rules-of-hooks": "off" },
  },
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
