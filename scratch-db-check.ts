import { prisma } from './src/lib/prisma';

async function main() {
  const run = await prisma.analysisRun.findFirst({
    orderBy: { createdAt: 'desc' },
  });

  if (!run) {
    console.log('No runs found');
    return;
  }

  console.log('--- Latest Run Details ---');
  console.log(`Run ID: ${run.id}`);
  console.log(`Review Status: ${run.reviewStatus}`);
  console.log(`Review Reason: ${run.reviewReason}`);
  console.log(`Confidence: ${run.confidence}`);
  console.log(`Root Cause: ${run.rootCause}`);
  console.log('--- Generated Patch ---');
  console.log(run.patch);
  console.log('---------------------');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
