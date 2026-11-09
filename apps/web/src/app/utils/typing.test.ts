import { describe, expect, it } from "vitest";
import {
  addTyper,
  removeTyper,
  shouldAnnounce,
  TYPING_ANNOUNCE_INTERVAL_MS,
  typingLabel,
} from "./typing";

const ana = { id: "p1", name: "Ana Souza" };
const bruno = { id: "p2", name: "Bruno Lima" };
const carla = { id: "p3", name: "Carla Dias" };

describe("shouldAnnounce", () => {
  it("avisa ao começar", () => {
    expect(shouldAnnounce("O", null, 1000)).toBe("start");
  });

  it("não repete antes do intervalo", () => {
    expect(shouldAnnounce("Ol", 1000, 1000 + TYPING_ANNOUNCE_INTERVAL_MS - 1)).toBeNull();
  });

  it("avisa de novo depois do intervalo", () => {
    expect(shouldAnnounce("Olá", 1000, 1000 + TYPING_ANNOUNCE_INTERVAL_MS)).toBe("start");
  });

  it("avisa que parou ao apagar tudo", () => {
    expect(shouldAnnounce("  ", 1000, 2000)).toBe("stop");
  });

  it("não avisa nada com o texto vazio sem ter avisado", () => {
    expect(shouldAnnounce("", null, 2000)).toBeNull();
  });
});

describe("lista de quem digita", () => {
  it("mantém a ordem de chegada", () => {
    expect(addTyper(addTyper(addTyper([], ana), bruno), ana)).toEqual([ana, bruno]);
  });

  it("tira a Pessoa no aviso de que parou", () => {
    expect(removeTyper([ana, bruno], ana.id)).toEqual([bruno]);
  });
});

describe("typingLabel", () => {
  it("uma Pessoa", () => {
    expect(typingLabel([ana])).toBe("Ana Souza está digitando…");
  });

  it("duas Pessoas", () => {
    expect(typingLabel([ana, bruno])).toBe("Ana Souza e Bruno Lima estão digitando…");
  });

  it("três ou mais", () => {
    expect(typingLabel([ana, bruno, carla])).toBe("Várias pessoas estão digitando…");
  });

  it("ninguém", () => {
    expect(typingLabel([])).toBe("");
  });
});
