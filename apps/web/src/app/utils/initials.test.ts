import { describe, expect, it } from "vitest";
import { initials } from "./initials";

describe("initials", () => {
  it("usa a primeira letra da primeira e da última palavra", () => {
    expect(initials("Ana Maria Souza")).toBe("AS");
  });

  it("usa uma letra só com uma palavra", () => {
    expect(initials("ana")).toBe("A");
  });

  it("mantém a letra com o acento combinado", () => {
    expect(initials("élida rocha")).toBe("ÉR");
  });

  it("não parte um caractere fora do BMP", () => {
    expect(initials("𝒜na Lima")).toBe("𝒜L");
  });

  it("devolve ? sem nome", () => {
    expect(initials("   ")).toBe("?");
  });
});
