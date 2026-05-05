import { prisma } from '@/lib/prisma';
import { fetchGithubContext } from '@/lib/github';
import { toAiReadyContext } from '@/lib/log-parser';
import { analyzeRootCause } from '@/services/gemini-analyzer';
import { generatePatch } from '@/services/patch-generator';
import { reviewPatch } from '@/services/patch-reviewer';
import { createFixPullRequest } from '@/services/github-pr';
import type { HealixPipelineResult } from '@/lib/types';

export async function runHealixPipeline(params: {
  failureId: string;
  owner: string;
  repo: string;
  workflowRunId: number;
  commitSha: string;
}): Promise<HealixPipelineResult> {
  const t0 = Date.now();

  const failure = await prisma.pipelineFailure.findUnique({ where: { id: params.failureId } });
  if (!failure) throw new Error(`Failure not found: ${params.failureId}`);

  // Mark as actively analyzing
  await prisma.pipelineFailure.update({
    where: { id: params.failureId },
    data: { status: 'analyzing' },
  });

  try {
    // ── Phase 1: GitHub context (logs + diff + failed steps) ──────────────
    const gh = await fetchGithubContext({
      owner: params.owner,
      repo: params.repo,
      workflowRunId: params.workflowRunId,
      commitSha: params.commitSha,
    });

    // Save raw logs to DB
    await prisma.pipelineFailure.update({
      where: { id: params.failureId },
      data: {
        logs: gh.logs.slice(0, 100_000), // cap storage
        errorSummary: gh.error_summary,
      },
    });

    // ── Phase 2: Log parsing & AI context ────────────────────────────────
    const aiCtx = toAiReadyContext(gh);

    // ── Phase 3: Root cause analysis (Gemini) ────────────────────────────
    const root = await analyzeRootCause(aiCtx);

    // ── Phase 4: Patch generation (GPT-OSS-120B) ─────────────────────────
    const patch = await generatePatch({
      root_cause: root.root_cause,
      logs: aiCtx.truncatedLog,
      file: root.affected_file,
      code_context:
        `Repo: ${aiCtx.repo}\nCommit: ${aiCtx.commit}\nFiles changed: ${aiCtx.filePaths.join(', ')}\n` +
        `Error summary: ${aiCtx.errorSummary}`,
    });

    // ── Phase 5: Patch review (GPT-OSS-120B reviewer) ────────────────────
    const review = await reviewPatch({
      rootCause: root.root_cause,
      originalCode: aiCtx.truncatedLog,
      patch: patch.patch,
    });

    // ── Phase 6: PR creation (if approved) ───────────────────────────────
    let prUrl: string | null = null;
    let prBranch: string | null = null;

    if (review.status === 'approved') {
      try {
        const pr = await createFixPullRequest({
          owner: params.owner,
          repo: params.repo,
          baseSha: params.commitSha,
          rootCause: root.root_cause,
          affectedFile: root.affected_file,
          patch: patch.patch,
          reviewer: review,
        });
        prUrl = pr.prUrl;
        prBranch = pr.branch;
      } catch (prErr) {
        console.error('[orchestrator] PR creation failed:', prErr);
        // Don't fail the entire pipeline over a PR error
      }
    }

    const elapsedMs = Date.now() - t0;

    // ── Phase 7: Persist results ──────────────────────────────────────────
    const run = await prisma.analysisRun.create({
      data: {
        failureId: params.failureId,
        rootCause: root.root_cause,
        category: root.category,
        confidence: root.confidence,
        affectedFile: root.affected_file,
        patch: patch.patch,
        reviewStatus: review.status,
        reviewReason: review.reason,
        reviewRiskLevel: review.risk_level,
        prLink: prUrl,
        prBranch: prBranch,
        executionTimeMs: elapsedMs,
        pipelineStage: prUrl ? 'pr' : review.status === 'approved' ? 'review' : 'patch',
      },
    });

    await prisma.pipelineFailure.update({
      where: { id: params.failureId },
      data: { status: 'analyzed' },
    });

    return {
      root,
      patch,
      review,
      prUrl,
      execution_time_ms: elapsedMs,
      analysisRunId: run.id,
    };
  } catch (err) {
    // Mark failure with error status
    await prisma.pipelineFailure.update({
      where: { id: params.failureId },
      data: { status: 'failed' },
    }).catch(() => {});
    throw err;
  }
}
