import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().default(3001),
  DATABASE_URL: z.string().min(1),
  AI_PROVIDER: z.enum(["gemini", "openai", "anthropic"]).default("openai"),
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().default("gemini-2.0-flash"),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().default("gpt-4o-mini"),
  ANTHROPIC_API_KEY: z.string().optional(),
  ANTHROPIC_MODEL: z.string().default("claude-3-5-haiku-latest"),
  AI_MOCK_MODE: z
    .enum(["true", "false"])
    .default("false")
    .transform((v) => v === "true"),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  LOG_LEVEL: z.string().default("info"),
});

export type Env = z.infer<typeof envSchema>;

export function loadConfig(): Env {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error("Invalid environment configuration:", result.error.flatten());
    process.exit(1);
  }
  return result.data;
}

export function hasAiCredentials(env: Env): boolean {
  switch (env.AI_PROVIDER) {
    case "gemini":
      return Boolean(env.GEMINI_API_KEY && env.GEMINI_API_KEY.length > 0);
    case "openai":
      return Boolean(env.OPENAI_API_KEY && env.OPENAI_API_KEY.length > 0);
    case "anthropic":
      return Boolean(env.ANTHROPIC_API_KEY && env.ANTHROPIC_API_KEY.length > 0);
    default:
      return false;
  }
}
