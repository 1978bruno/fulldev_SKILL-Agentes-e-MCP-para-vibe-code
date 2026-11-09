// Fuso padrão, usado enquanto o cookie de fuso não existe (LLD, "Valores e configuração").
export const DEFAULT_TIME_ZONE = "America/Sao_Paulo";

// Horas e minutos, em 24 h ("14:10"), iguais no servidor e no cliente porque o fuso é explícito.
export function formatTime(isoDate: string, timeZone: string = DEFAULT_TIME_ZONE): string {
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone,
  }).format(new Date(isoDate));
}
