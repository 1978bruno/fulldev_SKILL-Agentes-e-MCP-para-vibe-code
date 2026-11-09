"use server";

import { revalidatePath } from "next/cache";
import isUUID from "validator/lib/isUUID";
import {
  createChannel as createChannelInChat,
  type CreateChannelResult,
} from "@/app/services/chat-api";
import { readSessionToken } from "@/app/services/session-cookie";
import { isValidChannelName, isValidTopic } from "@/app/utils/channel-name";

// Criação de Canal público ou privado (spec da F04, "BFF"): valida como a API e grava pelo service. O
// clientId nasce quando o diálogo abre, e a nova tentativa leva o mesmo.
export async function createChannel(
  name: string,
  topic: string,
  isPrivate: boolean,
  clientId: string,
): Promise<CreateChannelResult> {
  if (
    typeof name !== "string" ||
    typeof topic !== "string" ||
    typeof isPrivate !== "boolean" ||
    typeof clientId !== "string" ||
    !isUUID(clientId) ||
    !isValidChannelName(name) ||
    !isValidTopic(topic)
  ) {
    return { kind: "invalid" };
  }
  const token = await readSessionToken();
  if (!token) return { kind: "unauthenticated" };
  const result = await createChannelInChat(token, {
    kind: isPrivate ? "private_channel" : "public_channel",
    name,
    topic: topic.trim(),
    clientId,
  });
  // A barra lateral, renderizada no servidor no layout das telas logadas, passa a ter o Canal.
  if (result.kind === "ok") revalidatePath("/", "layout");
  return result;
}
