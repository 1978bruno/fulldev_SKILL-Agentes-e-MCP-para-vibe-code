// Para o log: a primeira letra, *** e o domínio; um endereço de uma letra só vira ***, para o
// log nunca levar o e-mail completo.
export function maskEmail(email: string): string {
  const at = email.lastIndexOf('@');
  const local = at >= 0 ? email.slice(0, at) : email;
  const domain = at >= 0 ? email.slice(at + 1) : '';
  const visible = local.length > 1 ? local.charAt(0) : '';
  return `${visible}***@${domain}`;
}
