import { prisma } from './src/lib/prisma';
import { Octokit } from '@octokit/rest';

async function main() {
  const repo = await prisma.repository.findFirst({
    where: { repoName: 'Hanzlase/healixtesting' },
  });

  if (!repo) {
    console.error('Repository not found in DB');
    return;
  }

  const token = repo.githubToken || process.env.GITHUB_TOKEN;
  const octokit = new Octokit({ auth: token });

  try {
    console.log('Fetching files for PR #8...');
    const files = await octokit.pulls.listFiles({
      owner: 'Hanzlase',
      repo: 'healixtesting',
      pull_number: 8,
    });

    console.log('--- PR #8 Files ---');
    for (const f of files.data) {
      console.log(`File: ${f.filename}`);
      console.log(`Status: ${f.status}`);
      console.log(`Additions: ${f.additions}, Deletions: ${f.deletions}`);
      console.log(`Patch:\n${f.patch}`);
      console.log('-------------------');
    }
  } catch (err: any) {
    console.error('Failed to list files:', err.message || err);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
