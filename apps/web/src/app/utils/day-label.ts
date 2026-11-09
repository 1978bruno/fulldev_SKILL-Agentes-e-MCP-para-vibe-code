import { cachedFormatter } from "./date-formatters";

// Dia de um instante no fuso pedido, como "2026-11-09": base para agrupar e rotular os dias.
export function dayKey(isoDate: string | Date, timeZone: string): string {
  const formatter = cachedFormatter(`day:${timeZone}`, () =>
    new Intl.DateTimeFormat("en-CA", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      timeZone,
    }),
  );
  return formatter.format(new Date(isoDate));
}

const MONTHS = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

function previousDay(key: string): string {
  const [year, month, day] = key.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day - 1));
  return date.toISOString().slice(0, 10);
}

// Rótulo do divisor de dia (spec da F02, "Funções puras do histórico") a partir das chaves do dia
// e de hoje: "Hoje", "Ontem", a data sem o ano no ano corrente e com o ano nos anteriores.
export function labelForDay(day: string, today: string): string {
  if (day === today) return "Hoje";
  if (day === previousDay(today)) return "Ontem";
  const [year, month, dayOfMonth] = day.split("-").map(Number);
  const label = `${dayOfMonth} de ${MONTHS[month - 1]}`;
  return year === Number(today.slice(0, 4)) ? label : `${label} de ${year}`;
}

// O mesmo rótulo a partir do instante, do "agora" e do fuso.
export function dayLabel(isoDate: string, now: string | Date, timeZone: string): string {
  return labelForDay(dayKey(isoDate, timeZone), dayKey(now, timeZone));
}
