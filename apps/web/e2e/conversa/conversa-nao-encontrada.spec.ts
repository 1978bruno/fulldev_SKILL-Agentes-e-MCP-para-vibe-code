// spec: e2e/plano-de-testes-f02.md
// seed: e2e/seed.spec.ts
import { randomUUID } from "node:crypto";
import { expect, test } from "../fixtures";

test.describe("Abrir um Canal", () => {
  test("conversa-nao-encontrada", async ({ loggedInPage: page }) => {
    // 1. Abrir o endereço de uma Conversa que não existe
    await page.goto(`/conversas/${randomUUID()}`);

    await expect(page.getByRole("heading", { name: "Conversa não encontrada" })).toBeVisible();
    await expect(page.getByText("Ela não existe ou você não participa dela.")).toBeVisible();

    // 2. Voltar ao início
    await page.getByRole("link", { name: "Voltar ao início" }).click();

    await expect(page.getByRole("heading", { name: "Nenhuma conversa ainda" })).toBeVisible();
  });
});
