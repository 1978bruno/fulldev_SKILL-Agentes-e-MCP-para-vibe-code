// Fuso padrão, usado enquanto o cookie de fuso não existe (LLD, "Valores e configuração").
export const DEFAULT_TIME_ZONE = "America/Sao_Paulo";

// Um formatador por fuso: montar o Intl.DateTimeFormat é a parte cara, e a lista formata uma hora
// por Mensagem a cada renderização.
const formatters = new Map<string, Intl.DateTimeFormat>();

function formatterFor(timeZone: string): Intl.DateTimeFormat {
  let formatter = formatters.get(timeZone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
      timeZone,
    });
    formatters.set(timeZone, formatter);
  }
  return formatter;
}

// Horas e minutos, em 24 h ("14:10"), iguais no servidor e no cliente porque o fuso é explícito.
export function formatTime(isoDate: string, timeZone: string = DEFAULT_TIME_ZONE): string {
  return formatterFor(timeZone).format(new Date(isoDate));
}
