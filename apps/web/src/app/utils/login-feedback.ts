import type { LoginState } from "@/app/actions/login";
import { EMAIL_INVALID, PASSWORD_REQUIRED } from "@/app/utils/login-validation";

// O envio nativo do login (antes da hidratação) volta a "Entrar" com o tipo da falha na URL, sem
// o e-mail, para o formulário mostrar a mensagem certa.
export const LOGIN_FEEDBACK_PARAM = "falha";

const BY_STATUS: Partial<Record<LoginState["status"], string>> = {
  invalid_credentials: "credenciais",
  too_many_attempts: "tentativas",
  failure: "envio",
};

export function loginFeedbackValue(state: LoginState): string | null {
  if (state.status === "invalid_input") {
    const fields = [
      state.fieldErrors.email && "email",
      state.fieldErrors.password && "senha",
    ].filter(Boolean);
    return fields.join("-") || null;
  }
  return BY_STATUS[state.status] ?? null;
}

export function loginStateFromFeedback(value: unknown): LoginState {
  if (typeof value !== "string") return { status: "idle" };
  const status = Object.entries(BY_STATUS).find(([, param]) => param === value)?.[0];
  if (status) return { status } as LoginState;
  const fields = value.split("-");
  const fieldErrors = {
    email: fields.includes("email") ? EMAIL_INVALID : undefined,
    password: fields.includes("senha") ? PASSWORD_REQUIRED : undefined,
  };
  return fieldErrors.email || fieldErrors.password
    ? { status: "invalid_input", fieldErrors }
    : { status: "idle" };
}
