import { cachedFormatter } from "./date-formatters";

// Fuso padrão, usado enquanto o cookie de fuso não existe (LLD, "Valores e configuração").
export const DEFAULT_TIME_ZONE = "America/Sao_Paulo";

export function timeFormatter(timeZone: string): Intl.DateTimeFormat {
  return cachedFormatter(`time:${timeZone}`, () =>
    new Intl.DateTimeFormat("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
      timeZone,
    }),
  );
}

// Horas e minutos, em 24 h ("14:10"), iguais no servidor e no cliente porque o fuso é explícito.
export function formatTime(isoDate: string, timeZone: string = DEFAULT_TIME_ZONE): string {
  return timeFormatter(timeZone).format(new Date(isoDate));
}
