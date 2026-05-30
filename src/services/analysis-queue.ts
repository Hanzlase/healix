import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/logger';
import { runHealixPipeline, PipelineLockError } from '@/services/healix-orchestrator';
import type { HealixPipelineResult } from '@/lib/types';

type AnalysisJobPayload = {
  failureId: string;
  owner: string;
  repo: string;
  workflowRunId: number;
  commitSha: string;
};

type ProcessResult =
  | { status: 'completed'; result: HealixPipelineResult }
  | { status: 'queued'; nextAttemptAt: Date | null; reason?: string }
  | { status: 'failed'; reason?: string }
  | { status: 'skipped'; reason?: string };

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getConfig() {
  const maxAttempts = Number(process.env.ANALYSIS_MAX_ATTEMPTS ?? '3');
  const baseBackoffMs = Number(process.env.ANALYSIS_BACKOFF_MS ?? '2000');
  const lockTtlMs = Number(process.env.ANALYSIS_LOCK_TTL_MS ?? '120000');
  return {
    maxAttempts: Number.isFinite(maxAttempts) ? maxAttempts : 3,
    baseBackoffMs: Number.isFinite(baseBackoffMs) ? baseBackoffMs : 2000,
    lockTtlMs: Number.isFinite(lockTtlMs) ? lockTtlMs : 120000,
  };
}

function computeBackoffMs(base: number, attempt: number): number {
  const exp = Math.max(0, attempt - 1);
  const cap = 30000;
  const backoff = base * Math.pow(2, exp);
  return Math.min(backoff, cap);
}

function isRetryableError(err: unknown): boolean {
  if (err instanceof PipelineLockError) return true;
  const anyErr = err as any;
  const status = typeof anyErr?.status === 'number' ? anyErr.status : undefined;
  if (status && (status === 429 || status >= 500)) return true;

  const msg = String(anyErr?.message ?? '').toLowerCase();
  return (
    msg.includes('timeout') ||
    msg.includes('timed out') ||
    msg.includes('rate limit') ||
    msg.includes('econnreset') ||
    msg.includes('socket hang up')
  );
}

export async function enqueueAnalysisJob(payload: AnalysisJobPayload) {
  const now = new Date();
  return prisma.analysisJob.upsert({
    where: { failureId: payload.failureId },
    update: {
      owner: payload.owner,
      repo: payload.repo,
      workflowRunId: payload.workflowRunId,
      commitSha: payload.commitSha,
      status: 'queued',
      nextAttemptAt: now,
    },
    create: {
      failureId: payload.failureId,
      owner: payload.owner,
      repo: payload.repo,
      workflowRunId: payload.workflowRunId,
      commitSha: payload.commitSha,
      status: 'queued',
      nextAttemptAt: now,
    },
  });
}

export async function processAnalysisJob(jobId: string, workerId?: string): Promise<ProcessResult> {
  const { maxAttempts, baseBackoffMs, lockTtlMs } = getConfig();
  const now = new Date();
  const lockExpiry = new Date(now.getTime() - lockTtlMs);
  const worker = workerId ?? crypto.randomUUID();

  const claimed = await prisma.analysisJob.updateMany({
    where: {
      id: jobId,
      status: { in: ['queued', 'failed'] },
      nextAttemptAt: { lte: now },
      OR: [{ lockedAt: null }, { lockedAt: { lt: lockExpiry } }],
    },
    data: {
      status: 'processing',
      lockedAt: now,
      lockedBy: worker,
      attempts: { increment: 1 },
    },
  });

  if (claimed.count === 0) {
    return { status: 'skipped', reason: 'Job already claimed or not due yet' };
  }

  const job = await prisma.analysisJob.findUnique({ where: { id: jobId } });
  if (!job) return { status: 'skipped', reason: 'Job not found after claim' };

  const log = createLogger({ jobId, failureId: job.failureId, workerId: worker });

  try {
    const result = await runHealixPipeline(
      {
        failureId: job.failureId,
        owner: job.owner,
        repo: job.repo,
        workflowRunId: job.workflowRunId,
        commitSha: job.commitSha,
      },
      { markFailed: false }
    );

    await prisma.analysisJob.update({
      where: { id: jobId },
      data: {
        status: 'completed',
        lockedAt: null,
        lockedBy: null,
        completedAt: new Date(),
        lastError: null,
      },
    });

    return { status: 'completed', result };
  } catch (err) {
    log.error('Analysis job failed', {}, err);

    const attempts = job.attempts;
    const retryable = isRetryableError(err);

    if (retryable && attempts < maxAttempts) {
      const backoffMs = computeBackoffMs(baseBackoffMs, attempts);
      const nextAttemptAt = new Date(Date.now() + backoffMs);

      await prisma.analysisJob.update({
        where: { id: jobId },
        data: {
          status: 'queued',
          nextAttemptAt,
          lockedAt: null,
          lockedBy: null,
          lastError: String((err as any)?.message ?? err),
        },
      });

      await prisma.pipelineFailure.update({
        where: { id: job.failureId },
        data: { status: 'pending' },
      });

      return { status: 'queued', nextAttemptAt, reason: 'Retry scheduled' };
    }

    await prisma.analysisJob.update({
      where: { id: jobId },
      data: {
        status: 'failed',
        lockedAt: null,
        lockedBy: null,
        lastError: String((err as any)?.message ?? err),
      },
    });

    await prisma.pipelineFailure.update({
      where: { id: job.failureId },
      data: { status: 'failed' },
    });

    return { status: 'failed', reason: 'Max attempts reached or non-retryable error' };
  }
}

export async function processAnalysisJobWithRetries(
  jobId: string,
  options?: { maxInlineRetries?: number; maxWaitMs?: number }
): Promise<ProcessResult> {
  const maxInlineRetries = options?.maxInlineRetries ?? 1;
  const maxWaitMs = options?.maxWaitMs ?? 5000;

  let result = await processAnalysisJob(jobId);
  for (let attempt = 0; attempt < maxInlineRetries; attempt += 1) {
    if (result.status !== 'queued' || !result.nextAttemptAt) return result;
    const waitMs = Math.max(0, result.nextAttemptAt.getTime() - Date.now());
    if (waitMs > maxWaitMs) return result;
    await sleep(waitMs);
    result = await processAnalysisJob(jobId);
  }

  return result;
}

export async function processDueAnalysisJobs(limit = 5): Promise<ProcessResult[]> {
  const now = new Date();
  const jobs = await prisma.analysisJob.findMany({
    where: { status: 'queued', nextAttemptAt: { lte: now } },
    orderBy: { nextAttemptAt: 'asc' },
    take: Math.min(limit, 20),
  });

  const results: ProcessResult[] = [];
  for (const job of jobs) {
    results.push(await processAnalysisJob(job.id));
  }
  return results;
}
