import { EntityManager } from 'typeorm';

// Trava transacional da participação em Canal público (ADR 0024): criar um Canal público e criar
// uma conta tomam a mesma trava, para uma conta e um Canal criados ao mesmo tempo não deixarem a
// Pessoa fora do Canal. A chave é fixa e só serve a esta trava.
export const PUBLIC_MEMBERSHIP_LOCK_KEY = 2_024_000_001;

export async function lockPublicMembership(
  manager: EntityManager,
): Promise<void> {
  await manager.query('SELECT pg_advisory_xact_lock($1)', [
    PUBLIC_MEMBERSHIP_LOCK_KEY,
  ]);
}
