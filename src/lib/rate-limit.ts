type RateLimitState = {
  count: number;
  resetAt: number;
};

type RateLimitResult = {
  ok: boolean;
  remaining: number;
  resetAt: number;
};

type RateLimitOptions = {
  key: string;
  limit: number;
  windowMs: number;
};

const store = new Map<string, RateLimitState>();

function nowMs(): number {
  return Date.now();
}

export function getClientId(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]?.trim() || 'unknown';
  return req.headers.get('x-real-ip') ?? 'unknown';
}

export function getRateLimitConfig() {
  const enabled = (process.env.RATE_LIMIT_ENABLED ?? 'true') !== 'false';
  const windowMs = Number(process.env.RATE_LIMIT_WINDOW_MS ?? '60000');
  const limit = Number(process.env.RATE_LIMIT_MAX ?? '60');
  return {
    enabled,
    windowMs: Number.isFinite(windowMs) ? windowMs : 60000,
    limit: Number.isFinite(limit) ? limit : 60,
  };
}

export function checkRateLimit(options: RateLimitOptions): RateLimitResult {
  const now = nowMs();
  const entry = store.get(options.key);

  if (!entry || now > entry.resetAt) {
    const resetAt = now + options.windowMs;
    store.set(options.key, { count: 1, resetAt });
    return { ok: true, remaining: options.limit - 1, resetAt };
  }

  if (entry.count >= options.limit) {
    return { ok: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count += 1;
  store.set(options.key, entry);
  return { ok: true, remaining: options.limit - entry.count, resetAt: entry.resetAt };
}
