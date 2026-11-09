import { describe, expect, it } from "vitest";
import { splitLinks } from "./message-links";

describe("splitLinks", () => {
  it("separa um link https do texto em volta", () => {
    expect(splitLinks("Veja https://exemplo.com/a?b=1 agora")).toEqual([
      { kind: "text", text: "Veja " },
      { kind: "link", href: "https://exemplo.com/a?b=1" },
      { kind: "text", text: " agora" },
    ]);
  });

  it.each([".", ",", ";", ":", "!", "?", "..."])("deixa fora a pontuação final %p", (mark) => {
    expect(splitLinks(`Em http://exemplo.com${mark}`)).toEqual([
      { kind: "text", text: "Em " },
      { kind: "link", href: "http://exemplo.com" },
      { kind: "text", text: mark },
    ]);
  });

  it("deixa fora o ) que não abriu dentro do link", () => {
    expect(splitLinks("(veja https://exemplo.com/x).")).toEqual([
      { kind: "text", text: "(veja " },
      { kind: "link", href: "https://exemplo.com/x" },
      { kind: "text", text: ")." },
    ]);
  });

  it.each([
    ["entre aspas simples", "veja 'https://exemplo.com/a'", "veja '", "'"],
    ["entre aspas curvas", "veja “https://exemplo.com/a”", "veja “", "”"],
    ["entre colchetes", "[https://exemplo.com/a]", "[", "]"],
    ["entre chaves", "{https://exemplo.com/a}", "{", "}"],
  ])("deixa fora o fechamento de um link %s", (_caso, text, before, after) => {
    expect(splitLinks(text)).toEqual([
      { kind: "text", text: before },
      { kind: "link", href: "https://exemplo.com/a" },
      { kind: "text", text: after },
    ]);
  });

  it("mantém o ) que abriu dentro do link", () => {
    expect(splitLinks("https://pt.wikipedia.org/wiki/Canal_(comunicação)")).toEqual([
      { kind: "link", href: "https://pt.wikipedia.org/wiki/Canal_(comunicação)" },
    ]);
  });

  it.each([
    ["javascript:", "javascript:alert(1)"],
    ["ftp://", "ftp://exemplo.com"],
    ["www. sem esquema", "www.exemplo.com"],
    ["só o esquema", "https://"],
    ["marcação HTML", '<a href="https://exemplo.com">x</a>'.replace("https://exemplo.com", "x")],
  ])("deixa como texto %s", (_caso, text) => {
    expect(splitLinks(text)).toEqual([{ kind: "text", text }]);
  });

  it("acha vários links e mantém as quebras de linha", () => {
    expect(splitLinks("a https://um.com\nb https://dois.com")).toEqual([
      { kind: "text", text: "a " },
      { kind: "link", href: "https://um.com" },
      { kind: "text", text: "\nb " },
      { kind: "link", href: "https://dois.com" },
    ]);
  });

  it("devolve nada para texto vazio", () => {
    expect(splitLinks("")).toEqual([]);
  });
});
