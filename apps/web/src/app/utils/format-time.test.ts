import { describe, expect, it } from "vitest";
import { formatTime } from "./format-time";

describe("formatTime", () => {
  it("formata horas e minutos em 24 h no fuso pedido", () => {
    expect(formatTime("2026-11-09T17:10:00Z", "America/Sao_Paulo")).toBe("14:10");
    expect(formatTime("2026-11-09T03:05:00Z", "America/Sao_Paulo")).toBe("00:05");
    expect(formatTime("2026-11-09T17:10:00Z", "Asia/Tokyo")).toBe("02:10");
  });
});
