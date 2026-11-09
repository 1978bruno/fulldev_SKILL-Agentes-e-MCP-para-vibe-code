import { cookies } from "next/headers";
import type { LoginState } from "@/app/actions/login";
import { EMAIL_INVALID, PASSWORD_REQUIRED } from "@/app/utils/login-validation";

// O envio nativo do login (antes da hidratação) volta a "Entrar" com o tipo da falha num cookie
// de vida curta, só de /entrar: outro site não consegue gravá-lo, então a mensagem não pode ser
// forjada por um link. O formulário o apaga ao abrir.
export const LOGIN_FEEDBACK_COOKIE = "fc_login_feedback";
const MAX_AGE_SECONDS = 60;

const STATES: Record<string, LoginState> = {
  credenciais: { status: "invalid_credentials" },
  tentativas: { status: "too_many_attempts" },
  envio: { status: "failure" },
  email: { status: "invalid_input", fieldErrors: { email: EMAIL_INVALID } },
  senha: { status: "invalid_input", fieldErrors: { password: PASSWORD_REQUIRED } },
  "email-senha": {
    status: "invalid_input",
    fieldErrors: { email: EMAIL_INVALID, password: PASSWORD_REQUIRED },
  },
};

function valueOf(state: LoginState): string | undefined {
  switch (state.status) {
    case "invalid_credentials":
      return "credenciais";
    case "too_many_attempts":
      return "tentativas";
    case "failure":
      return "envio";
    case "invalid_input": {
      const { email, password } = state.fieldErrors;
      if (email && password) return "email-senha";
      return email ? "email" : password ? "senha" : undefined;
    }
    default:
      return undefined;
  }
}

// Só em Server Functions.
export async function writeLoginFeedback(state: LoginState): Promise<void> {
  const value = valueOf(state);
  if (!value) return;
  (await cookies()).set(LOGIN_FEEDBACK_COOKIE, value, {
    path: "/entrar",
    maxAge: MAX_AGE_SECONDS,
    sameSite: "lax",
  });
}

// Só os valores que writeLoginFeedback grava viram estado; qualquer outro é ignorado.
export async function readLoginFeedback(): Promise<LoginState> {
  const value = (await cookies()).get(LOGIN_FEEDBACK_COOKIE)?.value;
  return (value && Object.hasOwn(STATES, value) && STATES[value]) || { status: "idle" };
}
