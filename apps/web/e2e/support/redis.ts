import { createClient } from "redis";

// O Redis de desenvolvimento, como o banco em support/database.ts (LLD, "Ambiente de
// desenvolvimento"). Usado só para simular a perda dos eventos da reconexão.
export async function deleteEventsEpoch(): Promise<void> {
  const client = createClient({ url: process.env.REDIS_URL });
  await client.connect();
  try {
    await client.del("events:epoch");
  } finally {
    client.destroy();
  }
}
