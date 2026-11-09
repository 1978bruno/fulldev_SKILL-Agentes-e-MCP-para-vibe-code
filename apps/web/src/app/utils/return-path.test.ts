import { describe, expect, it } from "vitest";
import { safeReturnPath } from "./return-path";

describe("safeReturnPath", () => {
  it("aceita um caminho relativo da própria origem, com busca e âncora", () => {
    expect(safeReturnPath("/conversas/123?x=1#fim")).toBe("/conversas/123?x=1#fim");
  });

  it.each([
    ["sem valor", undefined],
    ["que não é texto", 42],
    ["vazio", ""],
    ["sem barra inicial", "conversas/123"],
    ["absoluto", "https://outro-site.com/"],
    ["com // no começo", "//outro-site.com"],
    ["com /\\ no começo", "/\\outro-site.com"],
  ])("leva à Home um valor %s", (_caso, value) => {
    expect(safeReturnPath(value)).toBe("/");
  });

  it.each([
    ["com tabulação que vira //", "/\t/outro-site.com"],
    ["com quebra de linha que vira //", "/\n/outro-site.com"],
    ["que a normalização transforma em //", "/a/..//outro-site.com"],
  ])("leva à Home um caminho %s", (_caso, value) => {
    expect(safeReturnPath(value)).toBe("/");
  });
});
