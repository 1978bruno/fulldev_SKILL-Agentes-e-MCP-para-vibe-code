// spec: e2e/plano-de-testes-f02.md
// seed: e2e/seed.spec.ts
import { expect, test } from "../fixtures";
import { messageList, readyHistory } from "../support/conversation-page";
import { insertMessages } from "../support/database";

test.describe("Ler as Mensagens", () => {
  test("links-e-texto-puro", async ({ page, person, memberChannel: channel, loggedInPage }) => {
    void loggedInPage;
    // 1. Abrir um Canal com um link e um texto com marcação HTML
    const markup = '<b>negrito</b> <img src=x onerror="window.__xss=1">';
    await insertMessages(channel, [
      {
        author: person,
        body: "Veja https://example.com/docs.",
        at: new Date(Date.now() - 120_000),
      },
      { author: person, body: markup, at: new Date(Date.now() - 60_000) },
    ]);
    await page.goto(`/conversas/${channel.id}`);
    await readyHistory(page, channel.name);
    const mensagens = messageList(page, channel.name);

    // O link http(s) abre em outra aba, sem o ponto final.
    const link = mensagens.getByRole("link", { name: "https://example.com/docs" });
    await expect(link).toHaveAttribute("href", "https://example.com/docs");
    await expect(link).toHaveAttribute("target", "_blank");
    await expect(link).toHaveAttribute("rel", "noopener noreferrer");

    // A marcação aparece como texto e não roda.
    await expect(mensagens.getByText(markup)).toBeVisible();
    await expect(mensagens.locator("b, img")).toHaveCount(0);
    expect(await page.evaluate(() => (window as { __xss?: number }).__xss)).toBeUndefined();
  });
});
