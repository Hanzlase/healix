import { z } from 'zod';

const boolish = z
  .string()
  .optional()
  .transform((v) => (v ?? '').toLowerCase())
  .pipe(z.enum(['true', 'false', '']))
  .transform((v) => v === 'true');

export const env = (() => {
  const schema = z.object({
    DATABASE_URL: z.string().min(1),

    NEXTAUTH_URL: z.string().url().optional(),
    NEXTAUTH_SECRET: z.string().min(1),

    GITHUB_CLIENT_ID: z.string().optional(),
    GITHUB_CLIENT_SECRET: z.string().optional(),

    GITHUB_WEBHOOK_SECRET: z.string().min(1),
    // For GitHub App auth (recommended for public deployments)
    GITHUB_APP_ID: z.string().min(1).optional(),
    // PEM private key. Accept either raw PEM with newlines or a single-line string with \n escapes.
    GITHUB_APP_PRIVATE_KEY: z.string().min(1).optional(),
    // Optional convenience for building the install URL in UI (e.g. "healix-bot")
    GITHUB_APP_SLUG: z.string().min(1).optional(),

    // Legacy fallback token (optional)
    GITHUB_TOKEN: z.string().optional(),

    GEMINI_API_KEY: z.string().min(1),

    GROQ_API_KEY: z.string().min(1),

    AUTH_CREDENTIALS_ENABLED: boolish,

    // Optional: auto-trigger full pipeline on webhook (default: true)
    AUTO_HEAL_ON_WEBHOOK: boolish,

    // Optional: rate limiting
    RATE_LIMIT_ENABLED: boolish,
    RATE_LIMIT_WINDOW_MS: z.string().optional(),
    RATE_LIMIT_MAX: z.string().optional(),

    // Optional: analysis queue/retry
    ANALYSIS_MAX_ATTEMPTS: z.string().optional(),
    ANALYSIS_BACKOFF_MS: z.string().optional(),
    ANALYSIS_LOCK_TTL_MS: z.string().optional(),
  });

  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    // Avoid dumping secrets: show keys only
    const keys = parsed.error.issues.map((i) => i.path.join('.')).join(', ');
    throw new Error(`Invalid environment variables: ${keys}`);
  }

  return parsed.data;
})();
