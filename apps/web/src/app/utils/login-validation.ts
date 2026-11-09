// Validação do formulário de entrar, a mesma no cliente e no Server Action (PRD, história 2).

export const EMAIL_INVALID = "Informe um e-mail válido, como nome@empresa.com.";
export const PASSWORD_REQUIRED = "Informe sua senha.";

// O mesmo teto da API do chat, para o cliente não aceitar o que ela recusa.
const EMAIL_MAX_LENGTH = 254;
// Parte local sem espaço nem @; domínio em rótulos de letras, dígitos e hífen (sem começar nem
// terminar com hífen), separados por um ponto, com o último rótulo só de letras: recusa
// "ana@empresa..com" e "ana@empresa/com.br", que a API recusaria.
const EMAIL_FORMAT =
  /^[^\s@]+@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/i;

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
