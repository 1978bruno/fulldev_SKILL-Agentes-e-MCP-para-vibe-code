// Iniciais do nome: o primeiro grafema da primeira e da última palavra, cada um em maiúscula.
// Por grafema (Intl.Segmenter), e não por unidade UTF-16, para não partir um caractere fora do
// BMP nem separar uma letra do acento combinado; e só o primeiro grafema da maiúscula, porque
// "ß" vira "SS".
const graphemes = new Intl.Segmenter("pt-BR", { granularity: "grapheme" });

function initialOf(word: string): string {
  const firstGrapheme = (text: string) =>
    graphemes.segment(text)[Symbol.iterator]().next().value?.segment ?? "";
  return firstGrapheme(firstGrapheme(word.normalize("NFC")).toUpperCase());
}

export function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  const last = words.length > 1 ? initialOf(words[words.length - 1]) : "";
  return `${initialOf(words[0])}${last}`;
}
