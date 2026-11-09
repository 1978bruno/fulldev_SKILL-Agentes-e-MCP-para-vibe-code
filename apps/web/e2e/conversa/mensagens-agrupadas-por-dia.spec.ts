// spec: e2e/plano-de-testes-f02.md
// seed: e2e/seed.spec.ts
import { expect, test } from "../fixtures";
import { messageList, readyHistory } from "../support/conversation-page";
import { insertMessages, insertPerson } from "../support/database";

// Meio-dia de `daysAgo` dias atrás em São Paulo (o fuso dos testes), mais `minutes` minutos.
function noonInSaoPaulo(daysAgo: number, minutes = 0): Date {
  const now = new Date();
  const local = new Date(now.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
  return new Date(
    Date.UTC(local.getFullYear(), local.getMonth(), local.getDate() - daysAgo, 15, minutes),
  );
}

test.describe("Ler as Mensagens", () => {
  test("mensagens-agrupadas-por-dia", async ({
    page,
    person,
    memberChannel: channel,
    loggedInPage,
  }) => {
    void loggedInPage;
    // 1. Abrir um Canal com Mensagens de ontem e de hoje, duas seguidas do mesmo autor
    const bruno = await insertPerson("Bruno Lima");
    await insertMessages(channel, [
      { author: bruno, body: "Mensagem de ontem", at: noonInSaoPaulo(1) },
      { author: person, body: "Primeira de hoje", at: noonInSaoPaulo(0) },
      { author: person, body: "Logo em seguida", at: noonInSaoPaulo(0, 2) },
      { author: person, body: "Bem depois", at: noonInSaoPaulo(0, 30) },
    ]);
    await page.goto(`/conversas/${channel.id}`);
    await readyHistory(page, channel.name);
    const mensagens = messageList(page, channel.name);
    const itens = mensagens.getByRole("listitem");

    await expect(itens).toHaveCount(4);
    // Os divisores separam os dias e não contam como Mensagem.
    await expect(mensagens.getByText("Ontem", { exact: true })).toBeVisible();
    await expect(mensagens.getByText("Hoje", { exact: true })).toBeVisible();
    // A segunda Mensagem seguida do mesmo autor é compacta: sem nome.
    await expect(itens.nth(1)).toContainText(person.name);
    await expect(itens.nth(2)).toContainText("Logo em seguida");
    await expect(itens.nth(2)).not.toContainText(person.name);
    // Com mais de 5 minutos, volta a forma completa.
    await expect(itens.nth(3)).toContainText(person.name);
  });
});
