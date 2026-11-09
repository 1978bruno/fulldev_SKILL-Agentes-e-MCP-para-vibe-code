import isEmail from "validator/lib/isEmail";

// Validação do formulário de entrar, a mesma no cliente e no Server Action (PRD, história 2).

export const EMAIL_INVALID = "Informe um e-mail válido, como nome@empresa.com.";
export const PASSWORD_REQUIRED = "Informe sua senha.";

// O mesmo teto e o mesmo isEmail (validator.js, com as opções padrão) do @IsEmail da API do
// chat: o cliente aceita e recusa os mesmos endereços que ela.
const EMAIL_MAX_LENGTH = 254;

export type LoginFieldErrors = { email?: string; password?: string };

export function validateLogin(input: {
  email: string;
  password: string;
}): LoginFieldErrors {
  const errors: LoginFieldErrors = {};
  const email = input.email.trim();
  if (!email || email.length > EMAIL_MAX_LENGTH || !isEmail(email)) {
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
