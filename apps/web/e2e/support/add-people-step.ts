import { randomUUIDv7 } from "node:crypto";
import { expect, type Browser, type Locator, type Page } from "@playwright/test";
import { logIn } from "../fixtures";
import { insertPerson, type TestPerson } from "./database";
import { addChannelButton, createChannelDialog } from "./create-channel-dialog";

export function addPeopleDialog(page: Page, channelName: string): Locator {
  return page.getByRole("dialog", { name: `Adicionar pessoas ao #${channelName}` });
}

// Uma Pessoa com nome único, para a busca achá-la entre as milhares do banco de desenvolvimento.
export async function insertUniquePerson(prefix = "Bruno"): Promise<TestPerson> {
  return insertPerson(`${prefix} ${randomUUIDv7().slice(-10)}`);
}

// A Pessoa logada num contexto novo do navegador.
export async function loggedInContext(browser: Browser, baseURL: string | undefined, person: TestPerson) {
  const context = await browser.newContext({ baseURL });
  const page = await context.newPage();
  await logIn(page, person);
  return { context, page };
}

// Cria o Canal privado pela tela e espera o passo "Adicionar pessoas".
export async function createPrivateChannel(page: Page, name: string): Promise<Locator> {
  await addChannelButton(page).click();
  const dialog = createChannelDialog(page);
  await dialog.getByRole("textbox", { name: "Nome" }).fill(name);
  await dialog.getByRole("switch", { name: "Tornar privado" }).click();
  await dialog.getByRole("button", { name: "Criar canal" }).click();
  const step = addPeopleDialog(page, name);
  await expect(step).toBeVisible();
  return step;
}
