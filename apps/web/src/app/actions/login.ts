"use server";

import { redirect } from "next/navigation";
import { login as loginToChat } from "@/app/services/chat-api";
import { writeSessionCookie } from "@/app/services/session-cookie";
import {
  hasErrors,
  validateLogin,
  type LoginFieldErrors,
} from "@/app/utils/login-validation";
import { loginPath, safeReturnPath } from "@/app/utils/return-path";

export type LoginState =
  | { status: "idle" }
  | { status: "invalid_input"; fieldErrors: LoginFieldErrors }
  | { status: "invalid_credentials" }
  | { status: "too_many_attempts" }
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
  if (result.kind === "too_many_attempts") {
    return { status: "too_many_attempts" };
  }
  if (result.kind === "failure") {
    return { status: "failure" };
  }

  await writeSessionCookie(result.token);
  redirect(safeReturnPath(formData.get("para")));
}

// O mesmo login, como ação nativa do <form>: funciona sem JavaScript e antes da hidratação. O
// login certo redireciona; nos outros casos a página volta a "Entrar" com o mesmo para, sem as
// mensagens, que dependem do formulário hidratado.
export async function submitLogin(formData: FormData): Promise<void> {
  await login({ status: "idle" }, formData);
  redirect(loginPath(formData.get("para")));
}
