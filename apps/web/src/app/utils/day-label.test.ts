import { describe, expect, it } from "vitest";
import { dayKey, dayLabel } from "./day-label";

const SP = "America/Sao_Paulo";
const NOW = "2026-11-09T15:00:00Z"; // 12:00 de 9/11 em São Paulo

describe("dayLabel", () => {
  it.each([
    ["no mesmo dia", "2026-11-09T03:00:00Z", "Hoje"],
    ["no dia anterior", "2026-11-08T20:00:00Z", "Ontem"],
    ["no ano corrente, sem o ano", "2026-11-03T12:00:00Z", "3 de novembro"],
    ["em anos anteriores, com o ano", "2025-11-03T12:00:00Z", "3 de novembro de 2025"],
  ])("rotula %s", (_caso, iso, label) => {
    expect(dayLabel(iso, NOW, SP)).toBe(label);
  });

  it("vira o dia no fuso, e não em UTC", () => {
    // 01:30 UTC de 9/11 ainda é 22:30 de 8/11 em São Paulo.
    expect(dayLabel("2026-11-09T01:30:00Z", NOW, SP)).toBe("Ontem");
    expect(dayLabel("2026-11-09T01:30:00Z", NOW, "UTC")).toBe("Hoje");
  });

  it("chama de Ontem o 31 de dezembro na virada de ano", () => {
    expect(dayLabel("2026-12-31T15:00:00Z", "2027-01-01T15:00:00Z", SP)).toBe("Ontem");
    expect(dayLabel("2026-12-30T15:00:00Z", "2027-01-01T15:00:00Z", SP)).toBe(
      "30 de dezembro de 2026",
    );
  });
});

describe("dayKey", () => {
  it("dá o dia no fuso pedido", () => {
    expect(dayKey("2026-11-09T01:30:00Z", SP)).toBe("2026-11-08");
    expect(dayKey("2026-11-09T01:30:00Z", "UTC")).toBe("2026-11-09");
  });
});
