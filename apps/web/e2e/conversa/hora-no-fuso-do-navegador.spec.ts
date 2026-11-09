// spec: e2e/plano-de-testes-f02.md
// seed: e2e/seed.spec.ts
import { expect, test } from "../fixtures";
import { messageList, readyHistory } from "../support/conversation-page";
import { insertMessages } from "../support/database";

test.use({ timezoneId: "Asia/Tokyo" });

test.describe("Ler as Mensagens", () => {
  test("hora-no-fuso-do-navegador", async ({
    page,
    person,
    memberChannel: channel,
    loggedInPage,
  }) => {
    void loggedInPage;
    const errors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    // 1. Abrir um Canal com uma Mensagem às 11:40 UTC, num navegador em Tóquio (UTC+9)
    await insertMessages(channel, [
      { author: person, body: "Bom dia de Tóquio", at: new Date("2026-11-09T11:40:00Z") },
    ]);
    await page.goto(`/conversas/${channel.id}`);
    await readyHistory(page, channel.name);

    // O cookie de fuso fica com o fuso do navegador, e a hora sai nele (20:40).
    await expect
      .poll(async () => (await page.context().cookies()).find((c) => c.name === "fc_tz")?.value)
      .toBe("Asia%2FTokyo");
    await expect(messageList(page, channel.name).getByRole("listitem").first()).toContainText(
      "20:40",
    );
    // 2. Recarregar: o servidor já renderiza no fuso do cookie, sem aviso de hidratação
    await page.reload();
    await readyHistory(page, channel.name);
    await expect(messageList(page, channel.name).getByRole("listitem").first()).toContainText(
      "20:40",
    );
    expect(errors.filter((text) => /hydrat/i.test(text))).toEqual([]);
  });
});
