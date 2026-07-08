import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import 'dotenv/config';

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  console.log("Fetching pipeline failures...");
  const failures = await prisma.pipelineFailure.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      analysisJobs: true,
      analysisRuns: true
    }
  });

  console.log("Found failures:", failures.length);
  for (const f of failures) {
    console.log(`\nFailure ID: ${f.id}`);
    console.log(`Commit SHA: ${f.commitSha}`);
    console.log(`Workflow Run ID: ${f.workflowRunId}`);
    console.log(`Status: ${f.status}`);
    console.log(`Error Summary: ${f.errorSummary}`);
    console.log(`Jobs associated:`, f.analysisJobs.map(j => ({ id: j.id, status: j.status, lastError: j.lastError })));
    console.log(`Runs associated:`, f.analysisRuns.map(r => ({ id: r.id, status: r.reviewStatus, pr: r.prLink })));
  }

  await prisma.$disconnect();
  await pool.end();
}

main().catch(err => {
  console.error("Error running script:", err);
});
