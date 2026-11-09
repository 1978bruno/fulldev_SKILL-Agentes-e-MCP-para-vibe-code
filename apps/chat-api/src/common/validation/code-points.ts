// Tamanho em pontos de código Unicode, igual ao char_length do Postgres e ao contador da web: um
// emoji conta 1 (spec da F02, "Mensagens").
export function codePointLength(text: string): number {
  return Array.from(text).length;
}
