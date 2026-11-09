import { z } from 'zod';
import { RENEWAL_INTERVAL_DAYS } from '../sessions/session-renewal';

export const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  PORT: z.coerce.number().int().positive().default(3000),
  SESSION_COOKIE_NAME: z.string().min(1),
  // Maior que o intervalo de renovação: senão a Sessão vence antes de poder ser renovada.
  SESSION_TTL_DAYS: z.coerce
    .number()
    .int()
    .min(RENEWAL_INTERVAL_DAYS + 1)
    .default(30),
});

export type Env = z.infer<typeof envSchema>;

export function parseEnv(raw: Record<string, unknown>): Env {
  const result = envSchema.safeParse(raw);
  if (!result.success) {
    const names = [
      ...new Set(result.error.issues.map((issue) => String(issue.path[0]))),
    ];
    throw new Error(`Configuração inválida: ${names.join(', ')}`);
  }
  return result.data;
}

export function loadEnv(): Env {
  return parseEnv(process.env);
}
