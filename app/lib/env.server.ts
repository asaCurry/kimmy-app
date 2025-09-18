import { z } from "zod";

const envSchema = z.object({
  DB: z.any(),
  RATE_LIMIT_KV: z.any().optional(),
  SESSION_SECRET: z
    .string()
    .min(32, "SESSION_SECRET must be at least 32 characters")
    .default("dev-session-secret-change-in-production-minimum-32-chars"),
  RESEND_API_KEY: z.string().optional(),
  ANALYTICS: z.any().optional(),
  KIMMY_EMAIL: z.any().optional(),
  AI: z.any().optional(), // Cloudflare AI binding for advanced analytics
  BASE_URL: z.string().optional(),
  ENVIRONMENT: z
    .enum(["development", "staging", "production"])
    .default("development"),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(env: unknown): Env {
  try {
    return envSchema.parse(env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.issues
        .map(issue => `${issue.path.join(".")}: ${issue.message}`)
        .join(", ");
      throw new Error(`Environment validation failed: ${errorMessages}`);
    }
    throw error;
  }
}

export function getValidatedEnv(context: any): Env {
  return validateEnv(context?.cloudflare?.env);
}
