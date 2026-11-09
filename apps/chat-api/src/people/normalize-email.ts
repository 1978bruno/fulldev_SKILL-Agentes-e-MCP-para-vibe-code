// O e-mail é gravado, comparado e contado no limite já normalizado (LLD, "Sessão e login").
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
