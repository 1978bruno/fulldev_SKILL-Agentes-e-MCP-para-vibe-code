import { test as base, expect, type Page } from "@playwright/test";
import {
  insertChannel,
  insertPerson,
  type TestChannel,
  type TestPerson,
} from "./support/database";
import { waitForLoginForm } from "./support/login-page";
import { waitForRealtime } from "./support/realtime";

type Fixtures = {
  person: TestPerson;
  memberChannel: TestChannel;
  loggedInPage: Page;
  // Tempo real (F03): uma segunda Pessoa, Membro do mesmo Canal que a primeira.
  otherPerson: TestPerson;
  sharedChannel: TestChannel;
  // A segunda Pessoa logada num contexto novo do navegador, com os próprios cookies.
  otherPage: Page;
};

export const test = base.extend<Fixtures>({
  // Pessoa criada direto no banco, com e-mail único e a senha conhecida de teste.
  person: async ({}, use) => {
    await use(await insertPerson());
  },

  // Canal público com a Pessoa da fixture como Membro, criado direto no banco.
  // "channel" é uma opção do Playwright (o canal do navegador), daí o nome.
  memberChannel: async ({ person }, use) => {
    await use(await insertChannel([person]));
  },

  // O único lugar que entra pelo formulário da tela Entrar. Sem Canais, a Pessoa fica na Home;
  // com Canais, a Home a leva ao primeiro.
  loggedInPage: async ({ page, person }, use) => {
    await logIn(page, person);
    await use(page);
  },

  otherPerson: async ({}, use) => {
    await use(await insertPerson("Bruno Lima"));
  },

  sharedChannel: async ({ person, otherPerson }, use) => {
    await use(await insertChannel([person, otherPerson]));
  },

  otherPage: async ({ browser, otherPerson }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await logIn(page, otherPerson);
    await use(page);
    await context.close();
  },
});

// Entra pelo formulário da tela Entrar.
export async function logIn(page: Page, person: TestPerson): Promise<void> {
  await page.goto("/entrar");
  await waitForLoginForm(page);
  await page.getByRole("textbox", { name: "E-mail" }).fill(person.email);
  await page.getByLabel("Senha").fill(person.password);
  await page.getByRole("button", { name: "Entrar" }).click();
  // Mais folga que o padrão: o login confere a senha com Argon2id e, com Canais, a Home leva à
  // Conversa, o que pesa no next dev com vários testes em paralelo.
  await expect(page.getByRole("navigation", { name: "Seções" })).toBeVisible({ timeout: 15_000 });
  // O socket conectado: um teste que revoga a Sessão logo depois não vê o handshake recusado
  // levando a aba a "Entrar" antes da ação dele.
  await waitForRealtime(page);
}

export { expect };
