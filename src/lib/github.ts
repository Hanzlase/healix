import { Octokit } from '@octokit/rest';
import type { GithubContext } from '@/lib/types';

function getOctokit() {
  const token = process.env.GITHUB_TOKEN;
  return new Octokit(token ? { auth: token } : undefined);
}

function summarizeError(logs: string): string {
  const lines = logs.split(/\r?\n/);
  const hits = lines.filter((l) => /(error|exception|failed|fatal|traceback)/i.test(l)).slice(0, 20);
  return hits.join('\n').slice(0, 1200) || lines.slice(0, 30).join('\n').slice(0, 1200);
}

function extractFilesFromDiff(diff: string): string[] {
  const files: string[] = [];
  const re = /^diff --git a\/(.+) b\/(.+)$/gm;
  let m: RegExpExecArray | null;
  while ((m = re.exec(diff))) {
    files.push(m[2]);
  }
  return Array.from(new Set(files)).slice(0, 50);
}

export async function fetchGithubContext(params: {
  owner: string;
  repo: string;
  workflowRunId: number;
  commitSha: string;
}): Promise<GithubContext> {
  const octokit = getOctokit();

  // 1) Logs (zip URL) – GitHub returns a redirect; Octokit returns data as ArrayBuffer in Node.
  const logsRes = await octokit.actions.downloadWorkflowRunLogs({
    owner: params.owner,
    repo: params.repo,
    run_id: params.workflowRunId,
  });

  // logsRes.data is ArrayBuffer; store as base64 to avoid heavy unzip in phase 1.
  const logsBase64 = Buffer.from(logsRes.data as ArrayBuffer).toString('base64');

  // 2) Commit diff
  const diffRes = await octokit.repos.getCommit({
    owner: params.owner,
    repo: params.repo,
    ref: params.commitSha,
    mediaType: {
      format: 'diff',
    },
  });

  const diffText = typeof diffRes.data === 'string' ? diffRes.data : '';

  // 3) Failed job steps (best-effort)
  let failedSteps: string[] = [];
  try {
    const jobs = await octokit.actions.listJobsForWorkflowRun({
      owner: params.owner,
      repo: params.repo,
      run_id: params.workflowRunId,
    });

    failedSteps = (jobs.data.jobs ?? [])
      .flatMap((j) => j.steps ?? [])
      .filter((s) => (s.conclusion ?? s.status) === 'failure')
      .map((s) => `${s.name}${s.number ? ` (#${s.number})` : ''}`)
      .slice(0, 50);
  } catch {
    // ignore
  }

  const files = Array.from(new Set([...extractFilesFromDiff(diffText), ...failedSteps]));

  return {
    repo: `${params.owner}/${params.repo}`,
    commit: params.commitSha,
    logs: logsBase64, // compressed/encoded logs
    files,
    error_summary: summarizeError(diffText),
  };
}
