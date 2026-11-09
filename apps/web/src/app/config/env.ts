import { z } from "zod";

const emptyAsUndefined = (value: unknown) => (value === "" ? undefined : value);

export const envSchema = z.object({
  CHAT_API_URL: z.url({ protocol: /^https?$/ }),
  SESSION_COOKIE_NAME: z.string().min(1),
  // Só o domínio, com o ponto opcional na frente (".exemplo.com"): sem esquema, porta nem barra.
  SESSION_COOKIE_DOMAIN: z.preprocess(
    emptyAsUndefined,
    z
      .string()
      .regex(/^\.?[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)*$/i)
      .optional(),
  ),
  SESSION_COOKIE_SECURE: z
    .enum(["true", "false"])
    .transform((value) => value === "true"),
});

export type Env = z.infer<typeof envSchema>;

export function parseEnv(raw: Record<string, unknown>): Env {
  const result = envSchema.safeParse(raw);
  if (!result.success) {
    // O nome e o motivo de cada variável: "faltando" e "inválida" não se confundem.
    const problems = result.error.issues.map(
      (issue) => `${String(issue.path[0])} (${issue.message})`,
    );
    throw new Error(`Configuração inválida: ${[...new Set(problems)].join(", ")}`);
  }
  return result.data;
}

// Lida e validada uma vez, no primeiro import do módulo (o instrumentation.ts faz isso na subida).
export const env = parseEnv(process.env);
