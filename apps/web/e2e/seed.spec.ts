import { test } from "./fixtures";

// Teste-semente: abre "Entrar" com uma Pessoa pronta. Os cenários de login partem daqui.
test("seed", async ({ page, person }) => {
  void person;
  await page.goto("/entrar");
});
