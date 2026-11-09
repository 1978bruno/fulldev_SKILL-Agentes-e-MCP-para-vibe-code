// Um Intl.DateTimeFormat por chave: montar o formatador é a parte cara, e a lista formata horas e
// dias de cada Mensagem a cada renderização.
const formatters = new Map<string, Intl.DateTimeFormat>();

export function cachedFormatter(
  key: string,
  build: () => Intl.DateTimeFormat,
): Intl.DateTimeFormat {
  let formatter = formatters.get(key);
  if (!formatter) {
    formatter = build();
    formatters.set(key, formatter);
  }
  return formatter;
}
