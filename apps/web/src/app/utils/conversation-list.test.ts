import { describe, expect, it } from "vitest";
import type { Conversation } from "@/app/services/chat-api";
import { applyMemberAdded } from "./conversation-list";

function channel(name: string, memberCount = 2): Conversation {
  return { id: `id-${name}`, kind: "public_channel", name, topic: null, memberCount };
}

describe("applyMemberAdded", () => {
  const list = [channel("abelha"), channel("zebra")];

  it("põe a Conversa nova na ordem alfabética para quem acabou de entrar", () => {
    const result = applyMemberAdded(list, channel("árvore"), ["eu", "outra"], "eu");

    expect(result.map((item) => item.name)).toEqual(["abelha", "árvore", "zebra"]);
  });

  it("não repete uma Conversa que já está na lista e atualiza a quantidade de Membros", () => {
    const result = applyMemberAdded(list, channel("zebra", 5), ["eu"], "eu");

    expect(result.map((item) => item.name)).toEqual(["abelha", "zebra"]);
    expect(result[1].memberCount).toBe(5);
  });

  it("só atualiza a quantidade para quem já era Membro", () => {
    const result = applyMemberAdded(list, channel("abelha", 3), ["outra"], "eu");

    expect(result[0].memberCount).toBe(3);
    expect(result).toHaveLength(2);
  });

  it("não põe uma Conversa de que a Pessoa não é Membro", () => {
    const result = applyMemberAdded(list, channel("segredo"), ["outra"], "eu");

    expect(result.map((item) => item.name)).toEqual(["abelha", "zebra"]);
  });
});
