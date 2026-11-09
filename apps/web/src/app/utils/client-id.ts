// Identificador gerado no cliente para o envio sem duplicar (LLD, "Concorrência e idempotência"):
// um UUID v4. Pelo getRandomValues, e não pelo crypto.randomUUID, que só existe em contexto seguro
// e falta num endereço http que não é localhost, como o dos testes de ponta a ponta.
export function newClientId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
