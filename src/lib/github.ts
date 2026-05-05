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

  // 1) Logs download
  let logsText = '';
  let logsIsZip = false;
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
    console.error('[github] Failed to fetch workflow logs:', err);
    logsText = '(Unable to fetch logs — check GITHUB_TOKEN permissions)';
  }

  // 2) Commit diff
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
    // ignore — token may not have workflow read access
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
