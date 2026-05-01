import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { fetchGithubContext } from '@/lib/github';
import { toAiReadyContext } from '@/lib/log-parser';
import { analyzeRootCause } from '@/services/gemini-analyzer';
import { runHealixPipeline } from '@/services/healix-orchestrator';

const BodySchema = z.object({
  failureId: z.string().min(1),
  owner: z.string().min(1),
  repo: z.string().min(1),
  workflowRunId: z.number().int().positive(),
  commitSha: z.string().min(7),
  mode: z.enum(['analyze_only', 'heal']).optional(),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: 'Invalid body' }, { status: 400 });
  }

  if (parsed.data.mode === 'heal') {
    const result = await runHealixPipeline({
      failureId: parsed.data.failureId,
      owner: parsed.data.owner,
      repo: parsed.data.repo,
      workflowRunId: parsed.data.workflowRunId,
      commitSha: parsed.data.commitSha,
    });

    return NextResponse.json({ ok: true, healed: true, result }, { status: 200 });
  }

  const { failureId, owner, repo, workflowRunId, commitSha } = parsed.data;

  const failure = await prisma.pipelineFailure.findUnique({ where: { id: failureId } });
  if (!failure) return NextResponse.json({ ok: false, error: 'Failure not found' }, { status: 404 });

  // Fetch GitHub context
  const gh = await fetchGithubContext({ owner, repo, workflowRunId, commitSha });

  // Logs in Phase 1 are stored base64 (compressed). The parser expects text; in Phase 1 we pass placeholder notice.
  // In real deployment, you'd unzip and parse. Here we keep it minimal but structured.
  const aiCtx = toAiReadyContext({
    ...gh,
    logs: `BASE64_ZIP_LOGS:${gh.logs.slice(0, 4000)}\n(Phase 1 stores logs compressed; unzip for full parsing.)`,
  });

  const analysis = await analyzeRootCause(aiCtx);

  await prisma.pipelineFailure.update({
    where: { id: failureId },
    data: {
      logs: gh.logs,
      status: 'analyzed',
    },
  });

  const run = await prisma.analysisRun.create({
    data: {
      failureId,
      rootCause: analysis.root_cause,
      category: analysis.category,
      confidence: analysis.confidence,
    },
  });

  return NextResponse.json({ ok: true, analysis: run, gemini: analysis }, { status: 200 });
}
