// Iniciais do nome: a primeira letra da primeira e da última palavra.
export function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  // O primeiro ponto de código de cada palavra, e não a primeira unidade UTF-16 (que partiria um
  // caractere fora do BMP).
  const firstOf = (word: string) => Array.from(word)[0] ?? "";
  const first = firstOf(words[0]);
  const last = words.length > 1 ? firstOf(words[words.length - 1]) : "";
  return `${first}${last}`.toUpperCase();
}
