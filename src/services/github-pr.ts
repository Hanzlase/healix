import { Octokit } from '@octokit/rest';
import { applyPatch } from 'diff';
import { getInstallationOctokit } from '@/lib/github-app';

function getOctokit() {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error('GITHUB_TOKEN is required for PR automation');
  return new Octokit({ auth: token });
}

async function getOctokitForPr(installationId?: number): Promise<Octokit> {
  if (installationId) return getInstallationOctokit(installationId);
  return getOctokit();
}

async function getDefaultBranch(octokit: Octokit, params: { owner: string; repo: string }) {
  const repo = await octokit.repos.get({ owner: params.owner, repo: params.repo });
  return repo.data.default_branch;
}

type FileUpdate = { path: string; content: string };

function extractUnifiedDiffFileTargets(patch: string): Array<{ path: string; filePatch: string }> {
  // Split multi-file diffs by "diff --git" boundaries.
  const parts = patch.split(/^diff --git /gm).filter(Boolean);
  return parts
    .map((p) => 'diff --git ' + p)
    .map((filePatch) => {
      const m = /^diff --git a\/(.+?) b\/(.+?)\r?$/m.exec(filePatch);
      if (!m) return null;
      const path = m[2];
      return { path, filePatch };
    })
    .filter((x): x is { path: string; filePatch: string } => !!x);
}

async function applyUnifiedDiffToRepoFile(params: {
  octokit: Octokit;
  owner: string;
  repo: string;
  branch: string;
  path: string;
  filePatch: string;
}): Promise<FileUpdate> {
  const { data } = await params.octokit.repos.getContent({
    owner: params.owner,
    repo: params.repo,
    path: params.path,
    ref: params.branch,
  });

  if (Array.isArray(data) || !('content' in data)) {
    throw new Error(`Unsupported path content type for ${params.path}`);
  }

  const original = Buffer.from((data as any).content, 'base64').toString('utf8');
  const updated = applyPatch(original, params.filePatch);

  if (updated === false) {
    throw new Error(`Failed to apply patch to ${params.path}`);
  }

  return { path: params.path, content: updated };
}

async function upsertFile(params: {
  octokit: Octokit;
  owner: string;
  repo: string;
  branch: string;
  path: string;
  content: string;
  message: string;
}): Promise<void> {
  const { data } = await params.octokit.repos.getContent({
    owner: params.owner,
    repo: params.repo,
    path: params.path,
    ref: params.branch,
  });

  if (Array.isArray(data)) throw new Error(`Cannot write to directory path: ${params.path}`);

  await params.octokit.repos.createOrUpdateFileContents({
    owner: params.owner,
    repo: params.repo,
    branch: params.branch,
    path: params.path,
    message: params.message,
    content: Buffer.from(params.content, 'utf8').toString('base64'),
    sha: (data as any).sha,
  });
}

export async function createFixPullRequest(params: {
  installationId?: number;
  owner: string;
  repo: string;
  baseSha: string;
  rootCause: string;
  affectedFile: string;
  patch: string;
  reviewer: { status: 'approved' | 'rejected'; reason: string; risk_level: 'low' | 'medium' | 'high' };
}): Promise<{ prUrl: string; branch: string }> {
  const octokit = await getOctokitForPr(params.installationId);
  const defaultBranch = await getDefaultBranch(octokit, { owner: params.owner, repo: params.repo });

  const branch = `healix/fix-${params.baseSha.slice(0, 7)}`;

  // Create branch from default branch head
  const baseRef = await octokit.git.getRef({ owner: params.owner, repo: params.repo, ref: `heads/${defaultBranch}` });
  await octokit.git.createRef({
    owner: params.owner,
    repo: params.repo,
    ref: `refs/heads/${branch}`,
    sha: baseRef.data.object.sha,
  });

  const message = `Healix: fix CI (${params.baseSha.slice(0, 7)})`;

  const isDiff = params.patch.includes('--- ') && params.patch.includes('+++ ');

  if (isDiff) {
    const targets = extractUnifiedDiffFileTargets(params.patch);
    if (targets.length === 0) {
      throw new Error('Patch looked like a diff but no file targets were detected');
    }

    for (const t of targets) {
      const updated = await applyUnifiedDiffToRepoFile({
        octokit,
        owner: params.owner,
        repo: params.repo,
        branch,
        path: t.path,
        filePatch: t.filePatch,
      });

      await upsertFile({
        octokit,
        owner: params.owner,
        repo: params.repo,
        branch,
        path: updated.path,
        content: updated.content,
        message,
      });
    }
  } else {
    // Full file replacement (single file)
    await upsertFile({
      octokit,
      owner: params.owner,
      repo: params.repo,
      branch,
      path: params.affectedFile,
      content: params.patch,
      message,
    });
  }

  const pr = await octokit.pulls.create({
    owner: params.owner,
    repo: params.repo,
    title: 'Healix: Automated Fix for CI Failure',
    head: branch,
    base: defaultBranch,
    body:
      `### Healix Automated Fix\n\n` +
      `**Root Cause:**\n${params.rootCause}\n\n` +
      `**Reviewer Verdict:**\n` +
      `- **Status:** ${params.reviewer.status.toUpperCase()}\n` +
      `- **Risk Level:** ${params.reviewer.risk_level}\n` +
      `- **Reason:** ${params.reviewer.reason}\n`,
  });

  return { prUrl: pr.data.html_url, branch };
}
