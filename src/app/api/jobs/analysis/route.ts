import { NextRequest, NextResponse } from 'next/server';
import { processDueAnalysisJobs } from '@/services/analysis-queue';
import { createLogger, getRequestId } from '@/lib/logger';
import { checkRateLimit, getClientId, getRateLimitConfig } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  const requestId = getRequestId(req);
  const log = createLogger({ requestId, route: 'jobs/analysis' });

  const rateConfig = getRateLimitConfig();
  if (rateConfig.enabled) {
    const rate = checkRateLimit({
      key: `jobs:${getClientId(req)}`,
      limit: Math.max(10, rateConfig.limit),
      windowMs: rateConfig.windowMs,
    });
    if (!rate.ok) {
      return NextResponse.json(
        { ok: false, error: 'Rate limit exceeded' },
        {
          status: 429,
          headers: {
            'Retry-After': Math.ceil((rate.resetAt - Date.now()) / 1000).toString(),
            'x-request-id': requestId,
          },
        }
      );
    }
  }

  try {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(Number(searchParams.get('limit') ?? '5'), 20);
    const results = await processDueAnalysisJobs(Number.isFinite(limit) ? limit : 5);
    return NextResponse.json(
      { ok: true, processed: results.length, results },
      { headers: { 'x-request-id': requestId } }
    );
  } catch (err) {
    log.error('Failed to process analysis jobs', {}, err);
    return NextResponse.json(
      { ok: false, error: 'Failed to process jobs' },
      { status: 500, headers: { 'x-request-id': requestId } }
    );
  }
}
