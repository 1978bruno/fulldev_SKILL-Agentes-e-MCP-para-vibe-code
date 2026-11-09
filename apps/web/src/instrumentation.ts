export async function register() {
  // NEXT_RUNTIME é do próprio Next: a configuração só é carregada no servidor Node.
  // eslint-disable-next-line no-restricted-properties
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Falha na subida, com o nome da variável, e nunca no primeiro uso.
    await import("./app/config/env");
  }
}
