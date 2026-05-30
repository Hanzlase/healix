import { prisma } from '@/lib/prisma';
import { fetchGithubContext } from '@/lib/github';
import { toAiReadyContext } from '@/lib/log-parser';
import { analyzeRootCause } from '@/services/gemini-analyzer';
import { generatePatch } from '@/services/patch-generator';
import { reviewPatch } from '@/services/patch-reviewer';
import { createFixPullRequest } from '@/services/github-pr';
import type { HealixPipelineResult } from '@/lib/types';
import { createLogger } from '@/lib/logger';

export class PipelineLockError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PipelineLockError';
  }
}

export async function runHealixPipeline(params: {
  failureId: string;
  owner: string;
  repo: string;
  workflowRunId: number;
  commitSha: string;
}, options?: { markFailed?: boolean }): Promise<HealixPipelineResult> {
  const t0 = Date.now();
  const markFailed = options?.markFailed ?? true;

  const locked = await prisma.pipelineFailure.updateMany({
    where: { id: params.failureId, status: { in: ['pending', 'failed'] } },
    data: { status: 'analyzing' },
  });

  if (locked.count === 0) {
    throw new PipelineLockError(`Failure is already being processed: ${params.failureId}`);
  }

  const failure = await prisma.pipelineFailure.findUnique({
    where: { id: params.failureId },
    include: { repository: true },
  });
  if (!failure) throw new Error(`Failure not found: ${params.failureId}`);

  const log = createLogger({
    failureId: params.failureId,
    owner: params.owner,
    repo: params.repo,
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

    const autoPrEnabled = failure.repository.autoPrEnabled !== false;
    let installationId: number | undefined;
    if (failure.repository.githubInstallationId) {
      const parsed = Number(failure.repository.githubInstallationId);
      if (Number.isFinite(parsed)) installationId = parsed;
    }

    if (review.status === 'approved' && autoPrEnabled) {
      try {
        const pr = await createFixPullRequest({
          installationId,
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
        log.error('PR creation failed', { stage: 'pr' }, prErr);
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
    log.error('Pipeline failed', { stage: 'pipeline' }, err);
    const status = markFailed ? 'failed' : 'pending';
    await prisma.pipelineFailure.update({
      where: { id: params.failureId },
      data: { status },
    }).catch(() => {});
    throw err;
  }
}
