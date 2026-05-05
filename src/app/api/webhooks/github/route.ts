import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import type { GithubFailureEvent } from '@/lib/types';

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
  const event = req.headers.get('x-github-event');

  // Acknowledge non-workflow events immediately
  if (event !== 'workflow_run') {
    return NextResponse.json({ ok: true, ignored: true }, { status: 200 });
  }

  const rawBody = await req.text();
  const signature = req.headers.get('x-hub-signature-256');
  const secret = process.env.GITHUB_WEBHOOK_SECRET;

  if (!secret) {
    console.error('[webhook] GITHUB_WEBHOOK_SECRET not set');
    return NextResponse.json({ ok: false, error: 'Webhook secret not configured' }, { status: 500 });
  }

  if (!verifySignature(rawBody, signature, secret)) {
    return NextResponse.json({ ok: false, error: 'Invalid signature' }, { status: 401 });
  }

  const body = JSON.parse(rawBody);
  const parsed = parseFailureEvent(body);

  // Ignore non-failure or incomplete events
  if (!parsed) {
    return NextResponse.json({ ok: true, ignored: true }, { status: 200 });
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

  // ── Auto-trigger the full healing pipeline ──────────────────────────────
  // We fire-and-forget using a background task. NextResponse is returned
  // immediately so GitHub doesn't time out the webhook (10s limit).
  const autoHeal = (process.env.AUTO_HEAL_ON_WEBHOOK ?? 'true') !== 'false';

  if (autoHeal) {
    // Dynamic import keeps the orchestrator out of the webhook parse phase
    import('@/services/healix-orchestrator')
      .then(({ runHealixPipeline }) =>
        runHealixPipeline({
          failureId: failure.id,
          owner: parsed.owner,
          repo: parsed.repoName,
          workflowRunId: parsed.workflowRunId,
          commitSha: parsed.commitSha,
        })
      )
      .then((result) => {
        console.log(
          `[webhook] Pipeline complete for ${failure.id}: ` +
          `${result.review.status} | PR: ${result.prUrl ?? 'none'}`
        );
      })
      .catch((err) => {
        console.error(`[webhook] Pipeline failed for ${failure.id}:`, err);
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
    },
    { status: 201 }
  );
}
