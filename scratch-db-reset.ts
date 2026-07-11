import { prisma } from './src/lib/prisma';

async function main() {
  console.log('Initiating database reset...');

  // Order of deletion matters due to foreign key constraints in postgresql
  console.log('1. Cleaning AnalysisRun...');
  await prisma.analysisRun.deleteMany({});

  console.log('2. Cleaning AnalysisJob...');
  await prisma.analysisJob.deleteMany({});

  console.log('3. Cleaning PipelineFailure...');
  await prisma.pipelineFailure.deleteMany({});

  console.log('4. Cleaning Repository...');
  await prisma.repository.deleteMany({});

  console.log('5. Cleaning Session...');
  await prisma.session.deleteMany({});

  console.log('6. Cleaning Account...');
  await prisma.account.deleteMany({});

  console.log('7. Cleaning User...');
  await prisma.user.deleteMany({});

  console.log('8. Cleaning VerificationToken...');
  await prisma.verificationToken.deleteMany({});

  console.log('🎉 Database fully reset and cleared!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
