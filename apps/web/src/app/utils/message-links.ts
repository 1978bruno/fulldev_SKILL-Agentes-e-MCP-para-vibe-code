export type TextSegment = { kind: "text"; text: string } | { kind: "link"; href: string };

// Só http:// e https:// viram link; nada mais do texto vira marcação.
const URL_PATTERN = /https?:\/\/[^\s<>"]+/gi;
const TRAILING_PUNCTUATION = /[.,;:!?]+$/;

// Tira do fim a pontuação e o ")" que não abriu dentro do próprio link, como em
// "(veja https://exemplo.com)".
function trimEnd(candidate: string): string {
  let url = candidate.replace(TRAILING_PUNCTUATION, "");
  while (url.endsWith(")")) {
    const opened = (url.match(/\(/g) ?? []).length;
    const closed = (url.match(/\)/g) ?? []).length;
    if (closed <= opened) break;
    url = url.slice(0, -1).replace(TRAILING_PUNCTUATION, "");
  }
  return url;
}

// Separa os links http(s) do texto da Mensagem (spec da F02, "Funções puras do histórico").
export function splitLinks(text: string): TextSegment[] {
  const segments: TextSegment[] = [];
  let cursor = 0;
  for (const match of text.matchAll(URL_PATTERN)) {
    const href = trimEnd(match[0]);
    if (!/^https?:\/\/[^/?#]/i.test(href)) continue;
    const start = match.index;
    if (start > cursor) segments.push({ kind: "text", text: text.slice(cursor, start) });
    segments.push({ kind: "link", href });
    cursor = start + href.length;
  }
  if (cursor < text.length) segments.push({ kind: "text", text: text.slice(cursor) });
  return segments;
}
