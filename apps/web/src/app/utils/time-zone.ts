import { DEFAULT_TIME_ZONE } from "./format-time";

// Cookie de fuso (LLD, "Cliente", "Cookies do cliente"): o fuso IANA do navegador.
export const TIME_ZONE_COOKIE = "fc_tz";

// Fuso válido do cookie, ou o fuso padrão quando ele falta ou não é um fuso IANA.
export function resolveTimeZone(value: string | undefined): string {
  if (!value) return DEFAULT_TIME_ZONE;
  try {
    new Intl.DateTimeFormat("pt-BR", { timeZone: value });
    return value;
  } catch {
    return DEFAULT_TIME_ZONE;
  }
}
