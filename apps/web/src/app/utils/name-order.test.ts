import { describe, expect, it } from "vitest";
import { compareNames } from "./name-order";

// Os mesmos casos do teste da API (apps/chat-api/src/conversations/name-order.spec.ts).
describe("compareNames", () => {
  it("põe acentos e maiúsculas junto da letra base", () => {
    const names = ["zebra", "Ábaco", "b", "árvore", "abelha", "Bruno"];

    expect([...names].sort(compareNames)).toEqual(["Ábaco", "abelha", "árvore", "b", "Bruno", "zebra"]);
  });

  it("põe a pontuação antes das letras", () => {
    expect(["zebra", "_meio", "abelha", "-traço"].sort(compareNames)).toEqual([
      "_meio",
      "-traço",
      "abelha",
      "zebra",
    ]);
  });

  it("desempata nomes iguais na comparação de base pela comparação simples", () => {
    expect(["ana", "Ana", "ána"].sort(compareNames)).toEqual(["Ana", "ana", "ána"]);
  });

  it("trata o nome ausente como vazio, antes dos outros", () => {
    expect(compareNames(null, "a")).toBeLessThan(0);
    expect(compareNames("a", null)).toBeGreaterThan(0);
    expect(compareNames(null, null)).toBe(0);
  });
});
