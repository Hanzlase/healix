import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import type { GithubFailureEvent } from '@/lib/types';
import { createLogger, getRequestId } from '@/lib/logger';
import { checkRateLimit, getClientId, getRateLimitConfig } from '@/lib/rate-limit';
import { enqueueAnalysisJob, processAnalysisJobWithRetries } from '@/services/analysis-queue';

export const maxDuration = 60; // 60 seconds limit for hobby tier

function verifySignature(rawBody: string, signatureHeader: string | null, secret: string): boolean {
  if (!signatureHeader) return false;
  const [algo, theirSig] = signatureHeader.split('=');
  if (algo !== 'sha256' || !theirSig) return false;

  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(rawBody, 'utf8');
  const ours = hmac.digest('hex');

  // Pad to same length before constant-time compare
  if (ours.length !== theirSig.length) {
    // Use same-length buffers to avoid timing leak
    const a = Buffer.alloc(32, 0);
    const b = Buffer.alloc(32, 0);
    Buffer.from(ours, 'hex').copy(a, 0, 0, Math.min(32, 32));
    Buffer.from(theirSig, 'hex').copy(b, 0, 0, Math.min(theirSig.length / 2, 32));
    return crypto.timingSafeEqual(a, b) && ours === theirSig;
  }

  const a = Buffer.from(ours, 'hex');
  const b = Buffer.from(theirSig, 'hex');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function parseFailureEvent(body: any): GithubFailureEvent | null {
  // Only process workflow_run events with conclusion: failure
  if (body?.workflow_run?.conclusion !== 'failure') return null;

  const repoFullName: string | undefined = body?.repository?.full_name;
  const sha: string | undefined = body?.workflow_run?.head_sha;
  const runId: number | undefined = body?.workflow_run?.id;
  const createdAt: string | undefined =
    body?.workflow_run?.updated_at ?? body?.workflow_run?.created_at;
  const workflowName: string | undefined = body?.workflow_run?.name;
  const branchName: string | undefined = body?.workflow_run?.head_branch;

  if (!repoFullName || !sha || !runId || !createdAt) return null;

  const [owner, repoName] = repoFullName.split('/');
  if (!owner || !repoName) return null;

  return {
    repoFullName,
    repoName,
    owner,
    workflowRunId: runId,
    workflowName,
    branchName,
    runAttempt: body?.workflow_run?.run_attempt,
    commitSha: sha,
    failureTimestamp: createdAt,
  };
}

export async function POST(req: Request) {
  const requestId = getRequestId(req);
  const log = createLogger({ requestId, route: 'webhooks/github' });

  const rateConfig = getRateLimitConfig();
  if (rateConfig.enabled) {
    const rate = checkRateLimit({
      key: `webhook:${getClientId(req)}`,
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

  const event = req.headers.get('x-github-event');

  // Acknowledge non-workflow events immediately
  if (event !== 'workflow_run') {
    log.info('Ignored event type', { event });
    return NextResponse.json(
      { ok: true, ignored: true, reason: `Not a workflow_run event (was ${event})` },
      { status: 200, headers: { 'x-request-id': requestId } }
    );
  }

  const rawBody = await req.text();
  const signature = req.headers.get('x-hub-signature-256');
  const secret = process.env.GITHUB_WEBHOOK_SECRET;

  if (!secret) {
    log.error('GITHUB_WEBHOOK_SECRET not set');
    return NextResponse.json(
      { ok: false, error: 'Webhook secret not configured' },
      { status: 500, headers: { 'x-request-id': requestId } }
    );
  }

  if (!verifySignature(rawBody, signature, secret)) {
    log.warn('Signature verification failed');
    return NextResponse.json(
      { ok: false, error: 'Invalid signature' },
      { status: 401, headers: { 'x-request-id': requestId } }
    );
  }

  let body: any;
  try {
    body = JSON.parse(rawBody);
  } catch (err) {
    log.warn('Invalid JSON payload', {}, err);
    return NextResponse.json(
      { ok: false, error: 'Invalid JSON payload' },
      { status: 400, headers: { 'x-request-id': requestId } }
    );
  }
  const parsed = parseFailureEvent(body);

  // Ignore non-failure or incomplete events
  if (!parsed) {
    log.info('Ignored workflow_run', {
      conclusion: body?.workflow_run?.conclusion,
      action: body?.action,
    });
    return NextResponse.json(
      { ok: true, ignored: true, reason: 'Not a failure conclusion or missing fields' },
      { status: 200, headers: { 'x-request-id': requestId } }
    );
  }

  // Upsert a system user to own webhook-triggered failures
  const systemEmail = 'system@healix.local';
  const user = await prisma.user.upsert({
    where: { email: systemEmail },
    update: {},
    create: { email: systemEmail },
  });

  const repo = await prisma.repository.upsert({
    where: { userId_repoName: { userId: user.id, repoName: parsed.repoFullName } },
    update: {},
    create: {
      userId: user.id,
      repoName: parsed.repoFullName,
      repoOwner: parsed.owner,
    },
  });

  const failure = await prisma.pipelineFailure.create({
    data: {
      repoId: repo.id,
      commitSha: parsed.commitSha,
      workflowRunId: String(parsed.workflowRunId),
      workflowName: parsed.workflowName,
      branchName: parsed.branchName,
      status: 'pending',
    },
  });

  const job = await enqueueAnalysisJob({
    failureId: failure.id,
    owner: parsed.owner,
    repo: parsed.repoName,
    workflowRunId: parsed.workflowRunId,
    commitSha: parsed.commitSha,
  });

  // ── Auto-trigger the full healing pipeline ──────────────────────────────
  // We use `after` to run the task in the background on Vercel after the response is sent.
  const autoHeal = (process.env.AUTO_HEAL_ON_WEBHOOK ?? 'true') !== 'false';

  if (autoHeal) {
    import('next/server').then(({ after }) => {
      after(() => {
        processAnalysisJobWithRetries(job.id, { maxInlineRetries: 1 })
          .then((result) => {
            log.info('Pipeline complete', {
              failureId: failure.id,
              status: result.status,
              nextAttemptAt: result.status === 'queued' ? result.nextAttemptAt?.toISOString() : undefined,
            });
          })
          .catch((err) => {
            log.error('Pipeline failed', { failureId: failure.id }, err);
          });
      });
    }).catch(err => {
        log.error('Failed to import next/server after', {}, err);
    });
  }

  return NextResponse.json(
    {
      ok: true,
      failureId: failure.id,
      event: {
        repo: parsed.repoFullName,
        sha: parsed.commitSha,
        runId: parsed.workflowRunId,
        workflow: parsed.workflowName,
        branch: parsed.branchName,
      },
      autoHeal,
      jobId: job.id,
    },
    { status: 201, headers: { 'x-request-id': requestId } }
  );
}
