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
