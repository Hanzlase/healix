import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { enqueueAnalysisJob, processAnalysisJobWithRetries } from '@/services/analysis-queue';
import { createLogger, getRequestId } from '@/lib/logger';
import { checkRateLimit, getClientId, getRateLimitConfig } from '@/lib/rate-limit';

export const maxDuration = 60; // 60 seconds limit for hobby tier

const BodySchema = z.object({
  failureId: z.string().min(1),
  owner: z.string().min(1),
  repo: z.string().min(1),
  workflowRunId: z.number().int().positive(),
  commitSha: z.string().min(7),
});

export async function POST(req: Request) {
  const requestId = getRequestId(req);
  const log = createLogger({ requestId, route: 'analyze' });

  const rateConfig = getRateLimitConfig();
  if (rateConfig.enabled) {
    const rate = checkRateLimit({
      key: `analyze:${getClientId(req)}`,
      limit: rateConfig.limit,
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

  const body = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: 'Invalid body', issues: parsed.error.issues },
      { status: 400, headers: { 'x-request-id': requestId } }
    );
  }

  const failure = await prisma.pipelineFailure.findUnique({ where: { id: parsed.data.failureId } });
  if (!failure) {
    return NextResponse.json(
      { ok: false, error: 'Failure not found' },
      { status: 404, headers: { 'x-request-id': requestId } }
    );
  }

  try {
    const job = await enqueueAnalysisJob({
      failureId: parsed.data.failureId,
      owner: parsed.data.owner,
      repo: parsed.data.repo,
      workflowRunId: parsed.data.workflowRunId,
      commitSha: parsed.data.commitSha,
    });

    const result = await processAnalysisJobWithRetries(job.id, { maxInlineRetries: 1 });

    if (result.status === 'completed') {
      return NextResponse.json(
        { ok: true, result: result.result },
        { status: 200, headers: { 'x-request-id': requestId } }
      );
    }

    if (result.status === 'queued') {
      return NextResponse.json(
        { ok: false, status: 'queued', jobId: job.id, nextAttemptAt: result.nextAttemptAt },
        { status: 202, headers: { 'x-request-id': requestId } }
      );
    }

    if (result.status === 'skipped') {
      return NextResponse.json(
        { ok: false, status: 'skipped', reason: result.reason ?? 'Job already running' },
        { status: 409, headers: { 'x-request-id': requestId } }
      );
    }

    return NextResponse.json(
      { ok: false, status: 'failed', reason: result.reason ?? 'Pipeline failed' },
      { status: 500, headers: { 'x-request-id': requestId } }
    );
  } catch (err: any) {
    log.error('Analyze pipeline error', {}, err);
    return NextResponse.json(
      { ok: false, error: err?.message ?? 'Pipeline failed' },
      { status: 500, headers: { 'x-request-id': requestId } }
    );
  }
}
