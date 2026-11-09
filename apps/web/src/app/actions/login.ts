"use server";

import { redirect } from "next/navigation";
import { login as loginToChat } from "@/app/services/chat-api";
import { writeSessionCookie } from "@/app/services/session-cookie";
import {
  hasErrors,
  validateLogin,
  type LoginFieldErrors,
} from "@/app/utils/login-validation";

export type LoginState =
  | { status: "idle" }
  | { status: "invalid_input"; fieldErrors: LoginFieldErrors }
  | { status: "invalid_credentials" }
  | { status: "failure" };

export async function login(
  _previous: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const fieldErrors = validateLogin({ email, password });
  if (hasErrors(fieldErrors)) {
    return { status: "invalid_input", fieldErrors };
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
