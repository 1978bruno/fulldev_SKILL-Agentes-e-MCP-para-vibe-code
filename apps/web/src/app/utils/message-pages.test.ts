import { describe, expect, it } from "vitest";
import type { Message } from "@/app/services/chat-api";
import { appendToLatestPage, flattenPages } from "./message-pages";

function message(id: string): Message {
  return {
    id,
    conversationId: "c1",
    clientId: `client-${id}`,
    author: { id: "p1", name: "Ana Souza", initials: "AS" },
    body: `Mensagem ${id}`,
    createdAt: "2026-11-09T12:00:00.000Z",
  };
}

describe("flattenPages", () => {
  it("põe as páginas anteriores antes da mais recente, em ordem cronológica", () => {
    const pages = [
      { messages: [message("5"), message("6")], hasMore: true },
      { messages: [message("3"), message("4")], hasMore: true },
      { messages: [message("1"), message("2")], hasMore: false },
    ];

    expect(flattenPages(pages).map((item) => item.id)).toEqual(["1", "2", "3", "4", "5", "6"]);
  });

  it("devolve uma lista vazia sem páginas", () => {
    expect(flattenPages([])).toEqual([]);
  });
});

describe("appendToLatestPage", () => {
  it("acrescenta a Mensagem no fim da página mais recente", () => {
    const older = { messages: [message("1")], hasMore: false };
    const pages = [{ messages: [message("2")], hasMore: true }, older];

    const result = appendToLatestPage(pages, message("3"));

    expect(result[0].messages.map((item) => item.id)).toEqual(["2", "3"]);
    expect(result[1]).toBe(older);
  });

  it("não repete uma Mensagem que já está na página", () => {
    const pages = [{ messages: [message("1")], hasMore: false }];

    expect(appendToLatestPage(pages, message("1"))).toBe(pages);
  });

  it("cria a página mais recente quando não há nenhuma", () => {
    expect(appendToLatestPage([], message("1"))).toEqual([
      { messages: [message("1")], hasMore: false },
    ]);
  });
});
