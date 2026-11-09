import { describe, expect, it } from "vitest";
import { codePointLength, MESSAGE_MAX_LENGTH } from "./message-text";

describe("codePointLength", () => {
  it("conta pontos de código, com um emoji valendo 1", () => {
    expect(codePointLength("olá")).toBe(3);
    expect(codePointLength("😀😀")).toBe(2);
    expect("😀😀".length).toBe(4);
  });

  it("chega exatamente ao limite com emojis", () => {
    expect(codePointLength("😀".repeat(MESSAGE_MAX_LENGTH))).toBe(MESSAGE_MAX_LENGTH);
  });
});
