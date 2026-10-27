import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(req.url);
    const guestReposParam = searchParams.get('repos');

    let runClause: Record<string, unknown> = {};
    let failureClause: Record<string, unknown> = {};
    if (session?.user && (session.user as { id?: string }).id) {
      const userId = (session.user as { id: string }).id;
      runClause = { failure: { repository: { userId } } };
      failureClause = { repository: { userId } };
    } else {
      const systemEmail = 'system@healix.local';
      const sysUser = await prisma.user.findUnique({ where: { email: systemEmail } });
      if (!sysUser) {
        return NextResponse.json({
          totalFailures: 0,
          totalRuns: 0,
          approvedRuns: 0,
          rejectedRuns: 0,
          successRate: 0,
          rejectionRate: 0,
          avgExecutionTimeMs: 0,
          avgConfidence: '0.0',
          prsCreated: 0,
          categoryBreakdown: {},
          riskLevelBreakdown: {},
        });
      }

      const repos = guestReposParam ? guestReposParam.split(',').filter(Boolean) : [];
      if (repos.length > 0) {
        runClause = { failure: { repository: { userId: sysUser.id, repoName: { in: repos } } } };
        failureClause = { repository: { userId: sysUser.id, repoName: { in: repos } } };
      } else {
        runClause = { failure: { repository: { userId: sysUser.id } } };
        failureClause = { repository: { userId: sysUser.id } };
      }
    }

    const [
      totalFailures,
      totalRuns,
      approvedRuns,
      rejectedRuns,
      avgExecTime,
      avgConfidence,
      prsCreated,
      allRuns,
    ] = await Promise.all([
      prisma.pipelineFailure.count({ where: failureClause }),
      prisma.analysisRun.count({ where: runClause }),
      prisma.analysisRun.count({ where: { ...runClause, reviewStatus: 'approved' } }),
      prisma.analysisRun.count({ where: { ...runClause, reviewStatus: 'rejected' } }),
      prisma.analysisRun.aggregate({ where: runClause, _avg: { executionTimeMs: true } }),
      prisma.analysisRun.aggregate({ where: runClause, _avg: { confidence: true } }),
      prisma.analysisRun.count({ where: { ...runClause, prLink: { not: null } } }),
      prisma.analysisRun.findMany({
        where: runClause,
        select: { category: true, reviewRiskLevel: true },
      }),
    ]);

    const successRate = totalRuns > 0 ? (approvedRuns / totalRuns) * 100 : 0;
    const rejectionRate = totalRuns > 0 ? (rejectedRuns / totalRuns) * 100 : 0;

    const categoryBreakdown: Record<string, number> = {};
    const riskLevelBreakdown: Record<string, number> = {};

    for (const r of allRuns) {
      if (r.category) {
        categoryBreakdown[r.category] = (categoryBreakdown[r.category] || 0) + 1;
      }
      if (r.reviewRiskLevel) {
        riskLevelBreakdown[r.reviewRiskLevel] = (riskLevelBreakdown[r.reviewRiskLevel] || 0) + 1;
      }
    }

    return NextResponse.json({
      totalFailures,
      totalRuns,
      approvedRuns,
      rejectedRuns,
      successRate: Math.round(successRate * 10) / 10,
      rejectionRate: Math.round(rejectionRate * 10) / 10,
      avgExecutionTimeMs: Math.round(avgExecTime._avg.executionTimeMs ?? 0),
      avgConfidence: ((avgConfidence._avg.confidence ?? 0) * 100).toFixed(1),
      prsCreated,
      categoryBreakdown,
      riskLevelBreakdown,
    });
  } catch (error) {
    console.error('[analytics] Failed:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
