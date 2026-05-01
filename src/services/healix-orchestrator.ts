import { prisma } from '@/lib/prisma';
import { fetchGithubContext } from '@/lib/github';
import { toAiReadyContext } from '@/lib/log-parser';
import { analyzeRootCause } from '@/services/gemini-analyzer';
import { generatePatch } from '@/services/patch-generator';
import { reviewPatch } from '@/services/patch-reviewer';
import { createFixPullRequest } from '@/services/github-pr';

export async function runHealixPipeline(params: {
  failureId: string;
  owner: string;
  repo: string;
  workflowRunId: number;
  commitSha: string;
}) {
  const t0 = Date.now();

  const failure = await prisma.pipelineFailure.findUnique({ where: { id: params.failureId } });
  if (!failure) throw new Error('Failure not found');

  // Phase 1: GitHub context (logs stored compressed)
  const gh = await fetchGithubContext({
    owner: params.owner,
    repo: params.repo,
    workflowRunId: params.workflowRunId,
    commitSha: params.commitSha,
  });

  const aiCtx = toAiReadyContext({
    ...gh,
    logs: `BASE64_ZIP_LOGS:${gh.logs.slice(0, 4000)}\n(Stored compressed; unzip in later phase.)`,
  });

  const root = await analyzeRootCause(aiCtx);

  // Patch generation uses the affected file and truncated log + summary.
  const patch = await generatePatch({
    root_cause: root.root_cause,
    logs: aiCtx.truncatedLog,
    file: root.affected_file,
    code_context: `Repo: ${aiCtx.repo}\nCommit: ${aiCtx.commit}\nFiles: ${aiCtx.filePaths.join(', ')}`,
  });

  const review = await reviewPatch({
    rootCause: root.root_cause,
    originalCode: aiCtx.truncatedLog,
    patch: patch.patch,
  });

  let prUrl: string | null = null;

  if (review.status === 'approved') {
    const pr = await createFixPullRequest({
      owner: params.owner,
      repo: params.repo,
      baseSha: params.commitSha,
      rootCause: root.root_cause,
      patch,
      reviewer: review,
    });
    prUrl = pr.prUrl;
  }

  const elapsedMs = Date.now() - t0;

  // Store end-to-end run details
  const run = await prisma.analysisRun.create({
    data: {
      failureId: params.failureId,
      rootCause: root.root_cause,
      category: root.category,
      confidence: root.confidence,
      patch: patch.patch,
      reviewStatus: review.status,
      prLink: prUrl,
      executionTimeMs: elapsedMs,
    },
  });

  return {
    root,
    patch,
    review,
    prUrl,
    execution_time_ms: elapsedMs,
    analysisRunId: run.id,
  };
}
