import { dayKey } from "./day-label";

// Intervalo da forma compacta (LLD, "Valores e configuração").
export const COMPACT_INTERVAL_MS = 5 * 60 * 1000;

type Groupable = { author: { id: string }; createdAt: string };

// Forma compacta (spec da F02, "Funções puras do histórico"): mesmo autor da Mensagem anterior,
// no mesmo dia do fuso e dentro do intervalo, inclusive no limite exato.
export function isCompact(
  previous: Groupable | undefined,
  current: Groupable,
  timeZone: string,
): boolean {
  if (!previous || previous.author.id !== current.author.id) return false;
  if (dayKey(previous.createdAt, timeZone) !== dayKey(current.createdAt, timeZone)) return false;
  const gap = Date.parse(current.createdAt) - Date.parse(previous.createdAt);
  return gap >= 0 && gap <= COMPACT_INTERVAL_MS;
}
