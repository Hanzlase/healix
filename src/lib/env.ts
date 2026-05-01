import { z } from 'zod';

const boolish = z
  .string()
  .optional()
  .transform((v) => (v ?? '').toLowerCase())
  .pipe(z.enum(['true', 'false', '']).optional())
  .transform((v) => v === 'true');

export const env = (() => {
  const schema = z.object({
    DATABASE_URL: z.string().min(1),

    NEXTAUTH_URL: z.string().url().optional(),
    NEXTAUTH_SECRET: z.string().min(1),

    GITHUB_CLIENT_ID: z.string().optional(),
    GITHUB_CLIENT_SECRET: z.string().optional(),

    GITHUB_WEBHOOK_SECRET: z.string().min(1),
    GITHUB_TOKEN: z.string().optional(),

    GEMINI_API_KEY: z.string().min(1),

    AUTH_CREDENTIALS_ENABLED: boolish,
  });

  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    // Avoid dumping secrets: show keys only
    const keys = parsed.error.issues.map((i) => i.path.join('.')).join(', ');
    throw new Error(`Invalid environment variables: ${keys}`);
  }

  return parsed.data;
})();
