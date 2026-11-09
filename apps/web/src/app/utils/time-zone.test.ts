import { describe, expect, it } from "vitest";
import { resolveTimeZone } from "./time-zone";

describe("resolveTimeZone", () => {
  it("aceita um fuso IANA", () => {
    expect(resolveTimeZone("Asia/Tokyo")).toBe("Asia/Tokyo");
  });

  it.each([undefined, "", "Marte/Olympus"])("usa o fuso padrão com %p", (value) => {
    expect(resolveTimeZone(value)).toBe("America/Sao_Paulo");
  });
});
