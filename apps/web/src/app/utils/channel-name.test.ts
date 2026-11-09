import { describe, expect, it } from "vitest";
import {
  isValidChannelName,
  isValidTopic,
  normalizeChannelNameInput,
  normalizeTopicInput,
} from "./channel-name";

describe("normalizeChannelNameInput", () => {
  it("põe em minúsculas, troca o espaço por - e tira o que a regra não aceita", () => {
    expect(normalizeChannelNameInput("Planejamento Q4!")).toBe("planejamento-q4");
  });

  it("mantém letras acentuadas, dígitos, - e _", () => {
    expect(normalizeChannelNameInput("Anúncios_2026-Liderança")).toBe("anúncios_2026-liderança");
  });

  it("tira o # e outros símbolos", () => {
    expect(normalizeChannelNameInput("#geral@time.")).toBe("geraltime");
  });

  it("junta a letra com o acento combinado em NFC", () => {
    expect(normalizeChannelNameInput("éxito")).toBe("\u00e9xito");
  });

  it("não começa com um acento solto", () => {
    expect(normalizeChannelNameInput("́abc")).toBe("abc");
  });

  it("para em 80 caracteres, contados em pontos de código", () => {
    expect(normalizeChannelNameInput("a".repeat(90))).toBe("a".repeat(80));
  });
});

describe("isValidChannelName", () => {
  it("aceita o nome da regra", () => {
    expect(isValidChannelName("planejamento-q4")).toBe(true);
  });

  it.each(["", "Geral", "com espaço", "a".repeat(81), "#geral"])("recusa %j", (name) => {
    expect(isValidChannelName(name)).toBe(false);
  });
});

describe("normalizeTopicInput", () => {
  it("troca as quebras de linha por espaço", () => {
    expect(normalizeTopicInput("linha 1\nlinha 2")).toBe("linha 1 linha 2");
  });

  it("para em 250 caracteres", () => {
    expect(normalizeTopicInput("a".repeat(260))).toBe("a".repeat(250));
  });
});

describe("isValidTopic", () => {
  it("aceita vazio e até 250 caracteres", () => {
    expect(isValidTopic("")).toBe(true);
    expect(isValidTopic("a".repeat(250))).toBe(true);
  });

  it("recusa quebra de linha e mais de 250 caracteres", () => {
    expect(isValidTopic("a\nb")).toBe(false);
    expect(isValidTopic("a".repeat(251))).toBe(false);
  });
});
