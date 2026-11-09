import { describe, expect, it } from "vitest";
import isUUID from "validator/lib/isUUID";
import { newClientId } from "./client-id";

describe("newClientId", () => {
  it("gera UUIDs v4 diferentes a cada chamada", () => {
    const ids = Array.from({ length: 50 }, newClientId);

    expect(ids.every((id) => isUUID(id, 4))).toBe(true);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
