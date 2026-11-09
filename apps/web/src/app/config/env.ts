import { z } from "zod";

const emptyAsUndefined = (value: unknown) => (value === "" ? undefined : value);

export const envSchema = z.object({
  CHAT_API_URL: z.url(),
  SESSION_COOKIE_NAME: z.string().min(1),
  SESSION_COOKIE_DOMAIN: z.preprocess(emptyAsUndefined, z.string().optional()),
  SESSION_COOKIE_SECURE: z
    .enum(["true", "false"])
    .transform((value) => value === "true"),
});

export type Env = z.infer<typeof envSchema>;

export function parseEnv(raw: Record<string, unknown>): Env {
  const result = envSchema.safeParse(raw);
  if (!result.success) {
    const names = [
      ...new Set(result.error.issues.map((issue) => String(issue.path[0]))),
    ];
    throw new Error(`Configuração inválida: ${names.join(", ")}`);
  }
  return result.data;
}

// Lida e validada uma vez, no primeiro import do módulo (o instrumentation.ts faz isso na subida).
export const env = parseEnv(process.env);
