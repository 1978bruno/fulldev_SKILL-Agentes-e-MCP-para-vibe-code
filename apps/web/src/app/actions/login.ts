"use server";

import { redirect } from "next/navigation";
import { login as loginToChat } from "@/app/services/chat-api";
import { writeSessionCookie } from "@/app/services/session-cookie";

export type LoginState =
  | { status: "idle" }
  | { status: "invalid_input" }
  | { status: "invalid_credentials" }
  | { status: "failure" };

export async function login(
  _previous: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  if (!email.trim() || !password) {
    return { status: "invalid_input" };
  }

  const result = await loginToChat(email, password);
  if (result.kind === "invalid_credentials") {
    return { status: "invalid_credentials" };
  }
  if (result.kind === "failure") {
    return { status: "failure" };
  }

  await writeSessionCookie(result.token);
  redirect("/");
}
