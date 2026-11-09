import { describe, expect, it } from "vitest";
import { COMPACT_INTERVAL_MS, isCompact } from "./message-grouping";

const SP = "America/Sao_Paulo";

function message(authorId: string, createdAt: string) {
  return { author: { id: authorId }, createdAt };
}

function plus(iso: string, ms: number): string {
  return new Date(Date.parse(iso) + ms).toISOString();
}

describe("isCompact", () => {
  const first = message("ana", "2026-11-09T12:00:00.000Z");

  it("é compacta com o mesmo autor, no mesmo dia e dentro do intervalo", () => {
    expect(isCompact(first, message("ana", plus(first.createdAt, 2 * 60_000)), SP)).toBe(true);
  });

  it("é completa com outro autor", () => {
    expect(isCompact(first, message("bruno", plus(first.createdAt, 60_000)), SP)).toBe(false);
  });

  it("é compacta exatamente no limite do intervalo e completa um milissegundo depois", () => {
    expect(isCompact(first, message("ana", plus(first.createdAt, COMPACT_INTERVAL_MS)), SP)).toBe(
      true,
    );
    expect(
      isCompact(first, message("ana", plus(first.createdAt, COMPACT_INTERVAL_MS + 1)), SP),
    ).toBe(false);
  });

  it("é completa no dia seguinte do fuso, mesmo dentro do intervalo", () => {
    // 23:58 e 00:01 em São Paulo: 3 minutos, mas dias diferentes.
    const late = message("ana", "2026-11-10T02:58:00.000Z");
    expect(isCompact(late, message("ana", "2026-11-10T03:01:00.000Z"), SP)).toBe(false);
  });

  it("a primeira Mensagem é sempre completa", () => {
    expect(isCompact(undefined, first, SP)).toBe(false);
  });
});
