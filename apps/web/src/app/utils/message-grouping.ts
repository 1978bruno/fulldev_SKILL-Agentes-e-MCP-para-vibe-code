// Intervalo da forma compacta (LLD, "Valores e configuração").
export const COMPACT_INTERVAL_MS = 5 * 60 * 1000;

// Uma Mensagem com o dia dela no fuso já calculado (day-label.ts, `dayKey`).
type Groupable = { author: { id: string }; createdAt: string; day: string };

// Forma compacta (spec da F02, "Funções puras do histórico"): mesmo autor da Mensagem anterior,
// no mesmo dia do fuso e dentro do intervalo, inclusive no limite exato.
export function isCompact(previous: Groupable | undefined, current: Groupable): boolean {
  if (!previous || previous.author.id !== current.author.id) return false;
  if (previous.day !== current.day) return false;
  const gap = Date.parse(current.createdAt) - Date.parse(previous.createdAt);
  return gap >= 0 && gap <= COMPACT_INTERVAL_MS;
}
