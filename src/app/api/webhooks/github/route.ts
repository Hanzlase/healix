import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import type { GithubFailureEvent } from '@/lib/types';

function verifySignature(rawBody: string, signatureHeader: string | null, secret: string) {
  if (!signatureHeader) return false;
  const [algo, theirSig] = signatureHeader.split('=');
  if (algo !== 'sha256' || !theirSig) return false;

  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(rawBody, 'utf8');
  const ours = hmac.digest('hex');

  // constant-time compare
  const a = Buffer.from(ours, 'hex');
  const b = Buffer.from(theirSig, 'hex');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function parseFailureEvent(body: any): GithubFailureEvent | null {
  if (body?.workflow_run?.conclusion !== 'failure') return null;

  const repoFullName: string | undefined = body?.repository?.full_name;
  const sha: string | undefined = body?.workflow_run?.head_sha;
  const runId: number | undefined = body?.workflow_run?.id;
  const createdAt: string | undefined = body?.workflow_run?.updated_at ?? body?.workflow_run?.created_at;

  if (!repoFullName || !sha || !runId || !createdAt) return null;

  const [owner, repoName] = repoFullName.split('/');
  if (!owner || !repoName) return null;

  return {
    repoFullName,
    repoName,
    owner,
    workflowRunId: runId,
    runAttempt: body?.workflow_run?.run_attempt,
    commitSha: sha,
    failureTimestamp: createdAt,
  };
}

export async function POST(req: Request) {
  const event = req.headers.get('x-github-event');
  if (event !== 'workflow_run') {
    return NextResponse.json({ ok: true, ignored: true }, { status: 200 });
  }

  const rawBody = await req.text();
  const signature = req.headers.get('x-hub-signature-256');
  const secret = process.env.GITHUB_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ ok: false, error: 'Missing webhook secret' }, { status: 500 });

  if (!verifySignature(rawBody, signature, secret)) {
    return NextResponse.json({ ok: false, error: 'Invalid signature' }, { status: 401 });
  }

  const body = JSON.parse(rawBody);
  const parsed = parseFailureEvent(body);
  if (!parsed) return NextResponse.json({ ok: true, ignored: true }, { status: 200 });

  // Phase 1: we store the failure; pipeline enrichment happens via /api/analyze
  // For authenticated users, failures are tied to a repository row. In phase 1, we upsert a pseudo repo row under a system user.
  const systemEmail = 'system@healix.local';
  const user = await prisma.user.upsert({
    where: { email: systemEmail },
    update: {},
    create: { email: systemEmail },
  });

  const repo = await prisma.repository.upsert({
    where: { userId_repoName: { userId: user.id, repoName: parsed.repoFullName } },
    update: {},
    create: { userId: user.id, repoName: parsed.repoFullName },
  });

  const failure = await prisma.pipelineFailure.create({
    data: {
      repoId: repo.id,
      commitSha: parsed.commitSha,
      status: 'pending',
    },
  });

  return NextResponse.json({ ok: true, failureId: failure.id, event: parsed }, { status: 201 });
}
