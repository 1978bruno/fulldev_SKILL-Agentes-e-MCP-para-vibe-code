import { z } from 'zod';

export const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  PORT: z.coerce.number().int().positive().default(3000),
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
