import { test as base, expect, type Page } from "@playwright/test";
import { insertPerson, type TestPerson } from "./support/database";

type Fixtures = {
  person: TestPerson;
  loggedInPage: Page;
};

export const test = base.extend<Fixtures>({
  // Pessoa criada direto no banco, com e-mail único e a senha conhecida de teste.
  person: async ({}, use) => {
    await use(await insertPerson());
  },

  // O único lugar que entra pelo formulário da tela Entrar.
  loggedInPage: async ({ page, person }, use) => {
    await page.goto("/entrar");
    await page.getByRole("textbox", { name: "E-mail" }).fill(person.email);
    await page.getByLabel("Senha").fill(person.password);
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page).toHaveURL("/");
    await use(page);
  },
});

export { expect };
