import { Octokit } from '@octokit/rest';
import type { GithubContext } from '@/lib/types';

function getOctokit() {
  const token = process.env.GITHUB_TOKEN;
  return new Octokit(token ? { auth: token } : undefined);
}

function summarizeError(text: string): string {
  const lines = text.split(/\r?\n/);
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

/**
 * Attempts to decode and extract text from GitHub's zipped log bundle (ArrayBuffer → base64 zip).
 * In production environments, you'd unzip this. We extract whatever text we can from the binary.
 */
function tryDecodeZipAsText(buf: Buffer): { text: string; isZip: boolean } {
  // Check for ZIP magic bytes (PK\x03\x04)
  if (buf[0] === 0x50 && buf[1] === 0x4b) {
    // It's a zip — extract readable ASCII text chunks (heuristic: log text within zip)
    const raw = buf.toString('binary');
    // Grab printable ASCII sequences of length > 40
    const readable = raw.match(/[ -~\t\r\n]{40,}/g) ?? [];
    return { text: readable.join('\n').slice(0, 50000), isZip: true };
  }
  // Not a zip, treat as plain text
  return { text: buf.toString('utf8'), isZip: false };
}

export async function fetchGithubContext(params: {
  owner: string;
  repo: string;
  workflowRunId: number;
  commitSha: string;
}): Promise<GithubContext> {
  const octokit = getOctokit();

  // 1) Failed job steps & listing jobs (best-effort)
  let failedSteps: string[] = [];
  let listedJobs: any[] = [];
  try {
    const jobsRes = await octokit.actions.listJobsForWorkflowRun({
      owner: params.owner,
      repo: params.repo,
      run_id: params.workflowRunId,
    });
    listedJobs = jobsRes.data.jobs ?? [];

    failedSteps = listedJobs
      .flatMap((j) => j.steps ?? [])
      .filter((s) => (s.conclusion ?? s.status) === 'failure')
      .map((s) => `${s.name}${s.number ? ` (#${s.number})` : ''}`)
      .slice(0, 50);
  } catch (err) {
    console.error('[github] Failed to list jobs:', err);
  }

  // 2) Logs download (attempt failed jobs first, fallback to zip bundle)
  let logsText = '';
  let logsIsZip = false;

  const failedJobs = listedJobs.filter(
    (j: any) => j.conclusion === 'failure' || (j.steps ?? []).some((s: any) => s.conclusion === 'failure')
  );

  if (failedJobs.length > 0) {
    for (const job of failedJobs) {
      try {
        const logRes = await octokit.actions.downloadJobLogsForWorkflowRun({
          owner: params.owner,
          repo: params.repo,
          job_id: job.id,
        });
        if (logRes.data) {
          const text = typeof logRes.data === 'string'
            ? logRes.data
            : Buffer.from(logRes.data as ArrayBuffer).toString('utf8');
          logsText += `--- Job: ${job.name} ---\n${text}\n`;
        }
      } catch (err) {
        console.error(`[github] Failed to download logs for job ${job.name} (${job.id}):`, err);
      }
    }
  }

  if (!logsText) {
    try {
      const logsRes = await octokit.actions.downloadWorkflowRunLogs({
        owner: params.owner,
        repo: params.repo,
        run_id: params.workflowRunId,
      });

      const buf = Buffer.from(logsRes.data as ArrayBuffer);
      const decoded = tryDecodeZipAsText(buf);
      logsText = decoded.text;
      logsIsZip = decoded.isZip;
    } catch (err) {
      console.error('[github] Failed to fetch workflow run logs zip:', err);
      logsText = '(Unable to fetch logs — check GITHUB_TOKEN permissions)';
    }
  }

  // 3) Commit diff
  let diffText = '';
  try {
    const diffRes = await octokit.repos.getCommit({
      owner: params.owner,
      repo: params.repo,
      ref: params.commitSha,
      mediaType: { format: 'diff' },
    });
    diffText = typeof diffRes.data === 'string' ? diffRes.data : '';
  } catch (err) {
    console.error('[github] Failed to fetch commit diff:', err);
  }

  const diffFiles = extractFilesFromDiff(diffText);
  const files = Array.from(new Set([...diffFiles, ...failedSteps]));

  // errorSummary: prefer log text for error extraction; fall back to diff
  const errorSummary = summarizeError(logsText || diffText);

  return {
    repo: `${params.owner}/${params.repo}`,
    commit: params.commitSha,
    logs: logsText,
    logsIsZip,
    files,
    error_summary: errorSummary,
  };
}
