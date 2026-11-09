// Validação do formulário de entrar, a mesma no cliente e no Server Action (PRD, história 2).

export const EMAIL_INVALID = "Informe um e-mail válido, como nome@empresa.com.";
export const PASSWORD_REQUIRED = "Informe sua senha.";

// O mesmo teto da API do chat, para o cliente não aceitar o que ela recusa.
const EMAIL_MAX_LENGTH = 254;
const EMAIL_FORMAT = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type LoginFieldErrors = { email?: string; password?: string };

export function validateLogin(input: {
  email: string;
  password: string;
}): LoginFieldErrors {
  const errors: LoginFieldErrors = {};
  const email = input.email.trim();
  if (!email || email.length > EMAIL_MAX_LENGTH || !EMAIL_FORMAT.test(email)) {
    errors.email = EMAIL_INVALID;
  }
  if (!input.password) {
    errors.password = PASSWORD_REQUIRED;
  }
  return errors;
}

export function hasErrors(errors: LoginFieldErrors): boolean {
  return Boolean(errors.email || errors.password);
}
