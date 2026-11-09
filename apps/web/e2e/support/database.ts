import { randomUUIDv7 } from "node:crypto";
import { Pool } from "pg";
import { TEST_PASSWORD, TEST_PASSWORD_HASH } from "./test-person";

// Os testes da web rodam contra o banco chat do ambiente de desenvolvimento. Cada Pessoa de
// teste tem e-mail de prefixo e2e- no domínio teste.local (LLD, "Ambiente de desenvolvimento").
const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 2 });

export type TestPerson = {
  id: string;
  name: string;
  email: string;
  password: string;
};

export async function insertPerson(name = "Ana Souza"): Promise<TestPerson> {
  const id = randomUUIDv7();
  const email = `e2e-${randomUUIDv7()}@teste.local`;
  await pool.query(
    "INSERT INTO people (id, email, name, password_hash) VALUES ($1, $2, $3, $4)",
    [id, email, name, TEST_PASSWORD_HASH],
  );
  return { id, name, email, password: TEST_PASSWORD };
}

// Revoga todas as Sessões da Pessoa, como o comando de contas faria.
export async function deleteSessionsOf(personId: string): Promise<void> {
  await pool.query("DELETE FROM sessions WHERE person_id = $1", [personId]);
}

export async function countSessionsOf(personId: string): Promise<number> {
  const result = await pool.query<{ count: string }>(
    "SELECT count(*) FROM sessions WHERE person_id = $1",
    [personId],
  );
  return Number(result.rows[0].count);
}

export type TestChannel = { id: string; name: string; topic: string | null };

// Canal público criado direto no banco, com nome de prefixo e2e- e só as participações das
// Pessoas que o teste passa: isola o teste dos Canais de outros testes e do desenvolvimento (spec
// da F02, "Decisões de teste").
export async function insertChannel(
  members: TestPerson[],
  options: { name?: string; topic?: string | null } = {},
): Promise<TestChannel> {
  const id = randomUUIDv7();
  const name = options.name ?? `e2e-${randomUUIDv7()}`;
  const topic = options.topic === undefined ? "Canal de teste" : options.topic;
  await pool.query(
    "INSERT INTO conversations (id, kind, name, topic) VALUES ($1, 'public_channel', $2, $3)",
    [id, name, topic],
  );
  for (const member of members) {
    await pool.query(
      "INSERT INTO conversation_members (id, conversation_id, person_id) VALUES ($1, $2, $3)",
      [randomUUIDv7(), id, member.id],
    );
  }
  return { id, name, topic };
}

// UUID v7 com o instante pedido, para as Mensagens ficarem na ordem das datas.
function uuidV7At(milliseconds: number): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  let time = BigInt(milliseconds);
  for (let index = 5; index >= 0; index -= 1) {
    bytes[index] = Number(time & 0xffn);
    time >>= 8n;
  }
  bytes[6] = (bytes[6] & 0x0f) | 0x70;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Buffer.from(bytes).toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export type TestMessage = { id: string; body: string; createdAt: Date };

// Mensagens direto no banco, em datas conhecidas e na ordem em que vêm.
export async function insertMessages(
  channel: TestChannel,
  messages: { author: TestPerson; body: string; at: Date }[],
): Promise<TestMessage[]> {
  const inserted: TestMessage[] = [];
  for (const message of messages) {
    const id = uuidV7At(message.at.getTime());
    await pool.query(
      `INSERT INTO messages (id, conversation_id, author_id, client_id, body, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $6)`,
      [id, channel.id, message.author.id, randomUUIDv7(), message.body, message.at],
    );
    inserted.push({ id, body: message.body, createdAt: message.at });
  }
  return inserted;
}
