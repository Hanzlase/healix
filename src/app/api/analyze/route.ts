import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { runHealixPipeline } from '@/services/healix-orchestrator';

const BodySchema = z.object({
  failureId: z.string().min(1),
  owner: z.string().min(1),
  repo: z.string().min(1),
  workflowRunId: z.number().int().positive(),
  commitSha: z.string().min(7),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: 'Invalid body', issues: parsed.error.issues }, { status: 400 });
  }

  const failure = await prisma.pipelineFailure.findUnique({ where: { id: parsed.data.failureId } });
  if (!failure) {
    return NextResponse.json({ ok: false, error: 'Failure not found' }, { status: 404 });
  }

  try {
    const result = await runHealixPipeline({
      failureId: parsed.data.failureId,
      owner: parsed.data.owner,
      repo: parsed.data.repo,
      workflowRunId: parsed.data.workflowRunId,
      commitSha: parsed.data.commitSha,
    });
    return NextResponse.json({ ok: true, result }, { status: 200 });
  } catch (err: any) {
    console.error('[analyze] Pipeline error:', err);
    return NextResponse.json({ ok: false, error: err?.message ?? 'Pipeline failed' }, { status: 500 });
  }
}
