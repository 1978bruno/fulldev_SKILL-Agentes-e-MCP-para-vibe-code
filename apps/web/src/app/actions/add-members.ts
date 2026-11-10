"use server";

import isUUID from "validator/lib/isUUID";
import { addMembers as addMembersInChat, type AddMembersResult } from "@/app/services/chat-api";
import { readSessionToken } from "@/app/services/session-cookie";

// Mesmo limite da API (LLD, "Valores e configuração", "Pessoas por adição ao Canal").
const MEMBERS_PER_ADD = 100;

// Adição ao Canal privado (spec da F04, "BFF"): valida como a API e grava pelo service.
export async function addMembers(
  conversationId: string,
  personIds: string[],
): Promise<AddMembersResult> {
  if (
    typeof conversationId !== "string" ||
    !isUUID(conversationId) ||
    !Array.isArray(personIds) ||
    personIds.length === 0 ||
    personIds.length > MEMBERS_PER_ADD ||
    new Set(personIds).size !== personIds.length ||
    !personIds.every((id) => typeof id === "string" && isUUID(id))
  ) {
    return { kind: "invalid" };
  }
  const token = await readSessionToken();
  if (!token) return { kind: "unauthenticated" };
  return addMembersInChat(token, conversationId, personIds);
}
