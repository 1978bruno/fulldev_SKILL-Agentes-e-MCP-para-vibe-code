import { cookies } from "next/headers";
import { LAST_CONVERSATION_COOKIE } from "@/app/utils/last-conversation";

// Id da última Conversa aberta naquele navegador, se houver.
export async function readLastConversation(): Promise<string | undefined> {
  return (await cookies()).get(LAST_CONVERSATION_COOKIE)?.value;
}
