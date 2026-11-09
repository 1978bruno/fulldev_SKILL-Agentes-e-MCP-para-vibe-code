// Para o log: a primeira letra, *** e o domínio. Quando isso não esconderia nada (parte local de
// uma letra, ou já feita de asteriscos, como "a***@" ou "***@"), o log leva só o domínio.
export function maskEmail(email: string): string {
  const at = email.lastIndexOf('@');
  const local = at >= 0 ? email.slice(0, at) : email;
  const domain = at >= 0 ? email.slice(at + 1) : '';
  const masked = `${local.charAt(0)}***@${domain}`;
  if (local.length <= 1 || masked === email || local.includes('*')) {
    return `(oculto)@${domain}`;
  }
  return masked;
}
