import { NextResponse } from 'next/server';
import { z } from 'zod';
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
  if (!parsed.success) return NextResponse.json({ ok: false, error: 'Invalid body' }, { status: 400 });

  const result = await runHealixPipeline(parsed.data);
  return NextResponse.json({ ok: true, result }, { status: 200 });
}
