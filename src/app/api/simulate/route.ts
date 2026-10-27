import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { enqueueAnalysisJob, processAnalysisJobWithRetries } from '@/services/analysis-queue';

export const maxDuration = 60;

const PRESET_SCENARIOS = {
  auth_type_error: {
    title: 'TypeScript Type Regression in Auth Handler',
    repo: 'Hanzlase/healixtesting',
    branch: 'fix/auth-provider',
    workflow: 'Test & Lint Suite',
    errorSummary: "TypeError: Cannot read properties of undefined (reading 'sessionToken') at Object.validateSession (src/lib/auth.ts:42:19)",
    logs: `[CI:RUN] Running jest on src/lib/auth.test.ts ...
FAIL src/lib/auth.test.ts
  ● Authentication Suite › should validate user session correctly

    TypeError: Cannot read properties of undefined (reading 'sessionToken')

      40 | export async function validateSession(req: Request) {
      41 |   const session = await getSession(req);
    > 42 |   const token = session.user.sessionToken;
         |                            ^
      43 |   if (!token) throw new AuthError('Missing token');
      44 |   return token;
      45 | }

      at Object.validateSession (src/lib/auth.ts:42:19)
      at Object.<anonymous> (src/lib/auth.test.ts:15:28)

Test Suites: 1 failed, 4 passed, 5 total
Tests:       1 failed, 19 passed, 20 total
Snapshots:   0 total
Time:        3.421 s
Error: Process completed with exit code 1.`,
    affectedFile: 'src/lib/auth.ts',
    rootCause: "Unsafe property access 'session.user.sessionToken' when session.user may be null or undefined. Requires optional chaining 'session?.user?.sessionToken'.",
    patch: `--- a/src/lib/auth.ts
+++ b/src/lib/auth.ts
@@ -40,4 +40,4 @@
 export async function validateSession(req: Request) {
   const session = await getSession(req);
-  const token = session.user.sessionToken;
+  const token = session?.user?.sessionToken;
   if (!token) throw new AuthError('Missing token');`,
    category: 'runtime',
    confidence: 0.98,
    reviewStatus: 'approved',
    reviewRiskLevel: 'low',
    reviewReason: 'Minimal and surgical bug fix. Adds safe null checks to prevent runtime TypeError without altering business logic.',
  },
  prisma_migration: {
    title: 'Database Schema Drift / Missing Column in Prisma Query',
    repo: 'Hanzlase/healixtesting',
    branch: 'feature/user-profiles',
    workflow: 'E2E Integration Pipeline',
    errorSummary: "PrismaClientKnownRequestError: The column 'fullName' does not exist in current database schema at prisma.user.create()",
    logs: `[DB:MIGRATE] Running integration test suite ...
FAIL src/tests/user-lifecycle.test.ts
  ● User Management › should persist new profile
    PrismaClientKnownRequestError:
    Invalid \`prisma.user.create()\` invocation:
    The column 'fullName' does not exist in current schema table 'users'. Did you mean 'name'?

      14 | export async function createUserProfile(data: { name: string; email: string }) {
    > 15 |   return await prisma.user.create({
         |          ^
      16 |     data: {
      17 |       fullName: data.name,
      18 |       email: data.email,
      19 |     }
      20 |   });

Error: Process completed with exit code 1.`,
    affectedFile: 'src/services/user-service.ts',
    rootCause: "Database model field mismatch: schema specifies 'name' field on model User, but invocation used 'fullName'.",
    patch: `--- a/src/services/user-service.ts
+++ b/src/services/user-service.ts
@@ -16,3 +16,3 @@
     data: {
-      fullName: data.name,
+      name: data.name,
       email: data.email,`,
    category: 'build',
    confidence: 0.96,
    reviewStatus: 'approved',
    reviewRiskLevel: 'low',
    reviewReason: 'Fixes mapping from input name to model user.name matching the Prisma schema definition.',
  },
  dependency_missing: {
    title: 'Missing Production Dependency in Deployment Build',
    repo: 'Hanzlase/healixtesting',
    branch: 'release/v1.4.0',
    workflow: 'Production Bundle Build',
    errorSummary: "ModuleNotFoundError: Cannot resolve module 'zod' in src/lib/validators.ts",
    logs: `[NEXT:BUILD] Creating production bundle...
Failed to compile.

./src/lib/validators.ts:3:1
Module not found: Can't resolve 'zod' in '/workspace/src/lib'
  1 | import { NextRequest } from 'next/server';
> 2 | import { z } from 'zod';
    | ^

Import trace for requested module:
./src/app/api/repositories/route.ts

> Build failed because of webpack errors
npm error Lifecycle script 'build' failed with error code 1`,
    affectedFile: 'package.json',
    rootCause: "Module 'zod' was imported in src/lib/validators.ts but was not present under 'dependencies' in package.json.",
    patch: `--- a/package.json
+++ b/package.json
@@ -25,2 +25,3 @@
     "react-dom": "19.2.4",
+    "zod": "^3.23.8",
     "pg": "^8.20.0"`,
    category: 'dependency',
    confidence: 0.99,
    reviewStatus: 'approved',
    reviewRiskLevel: 'low',
    reviewReason: 'Adds required zod schema validation package to dependencies.',
  },
};

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await req.json().catch(() => ({}));
    const scenarioKey = body.scenario || 'auth_type_error';
    const autoAnalyze = body.autoAnalyze !== false;

    const preset = (PRESET_SCENARIOS as any)[scenarioKey] || PRESET_SCENARIOS.auth_type_error;

    // Determine owner user: authed user or system user
    let user;
    if (session?.user && (session.user as any).id) {
      user = await prisma.user.findUnique({ where: { id: (session.user as any).id } });
    } else {
      const systemEmail = 'system@healix.local';
      user = await prisma.user.upsert({
        where: { email: systemEmail },
        update: {},
        create: { email: systemEmail, name: 'Healix System' },
      });
    }

    if (!user) {
      return NextResponse.json({ error: 'User could not be resolved' }, { status: 500 });
    }

    const repoFullName = body.repoFullName || preset.repo;
    const [owner, repoName] = repoFullName.includes('/') ? repoFullName.split('/') : ['healix', repoFullName];

    // Find or create repository
    const repository = await prisma.repository.upsert({
      where: { userId_repoName: { userId: user.id, repoName: repoFullName } },
      update: {},
      create: {
        userId: user.id,
        repoName: repoFullName,
        repoOwner: owner,
        autoPrEnabled: true,
      },
    });

    const commitSha = body.commitSha || Math.random().toString(16).slice(2, 9) + Math.random().toString(16).slice(2, 9);
    const workflowRunId = String(Date.now()).slice(-8);

    // Create the simulated pipeline failure
    const failure = await prisma.pipelineFailure.create({
      data: {
        repoId: repository.id,
        commitSha,
        workflowRunId,
        workflowName: body.workflowName || preset.workflow,
        branchName: body.branchName || preset.branch,
        status: autoAnalyze ? 'analyzing' : 'pending',
        logs: body.logs || preset.logs,
        errorSummary: body.errorSummary || preset.errorSummary,
      },
    });

    let run = null;
    if (autoAnalyze) {
      // Create high-fidelity analysis run
      const prBranch = `healix/fix-${commitSha.slice(0, 7)}`;
      const prUrl = `https://github.com/${repoFullName}/pull/${Math.floor(10 + Math.random() * 80)}`;

      run = await prisma.analysisRun.create({
        data: {
          failureId: failure.id,
          rootCause: preset.rootCause,
          category: preset.category,
          confidence: preset.confidence,
          affectedFile: preset.affectedFile,
          patch: preset.patch,
          reviewStatus: preset.reviewStatus,
          reviewReason: preset.reviewReason,
          reviewRiskLevel: preset.reviewRiskLevel,
          prLink: prUrl,
          prBranch: prBranch,
          executionTimeMs: 1420 + Math.floor(Math.random() * 800),
          pipelineStage: 'pr',
        },
      });

      await prisma.pipelineFailure.update({
        where: { id: failure.id },
        data: { status: 'analyzed' },
      });
    }

    return NextResponse.json({
      success: true,
      failureId: failure.id,
      runId: run?.id,
      commitSha,
      scenario: preset.title,
    });
  } catch (error: any) {
    console.error('[simulate] Error:', error);
    return NextResponse.json({ error: error?.message || 'Simulation failed' }, { status: 500 });
  }
}
