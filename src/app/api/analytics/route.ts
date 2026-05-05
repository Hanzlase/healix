import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(req.url);
    const guestReposParam = searchParams.get('repos');

    let runClause = {};
    let failureClause = {};
    if (session?.user && (session.user as any).id) {
      runClause = { failure: { repository: { userId: (session.user as any).id } } };
      failureClause = { repository: { userId: (session.user as any).id } };
    } else if (guestReposParam) {
      const repos = guestReposParam.split(',');
      const systemEmail = 'system@healix.local';
      const sysUser = await prisma.user.findUnique({ where: { email: systemEmail } });
      if (!sysUser) return NextResponse.json({ totalFailures: 0, totalRuns: 0, approvedRuns: 0, rejectedRuns: 0, successRate: 0, rejectionRate: 0, avgExecutionTimeMs: 0, avgConfidence: '0.0', prsCreated: 0, categoryBreakdown: {}, riskLevelBreakdown: {} });
      runClause = { failure: { repository: { userId: sysUser.id, repoName: { in: repos } } } };
      failureClause = { repository: { userId: sysUser.id, repoName: { in: repos } } };
    } else {
      return NextResponse.json({ totalFailures: 0, totalRuns: 0, approvedRuns: 0, rejectedRuns: 0, successRate: 0, rejectionRate: 0, avgExecutionTimeMs: 0, avgConfidence: '0.0', prsCreated: 0, categoryBreakdown: {}, riskLevelBreakdown: {} });
    }

    const [
      totalFailures,
      totalRuns,
      approvedRuns,
      rejectedRuns,
      avgExecTime,
      avgConfidence,
      prsCreated,
      categoryGroups,
      riskGroups,
    ] = await Promise.all([
      prisma.pipelineFailure.count({ where: failureClause }),
      prisma.analysisRun.count({ where: runClause }),
      prisma.analysisRun.count({ where: { ...runClause, reviewStatus: 'approved' } }),
      prisma.analysisRun.count({ where: { ...runClause, reviewStatus: 'rejected' } }),
      prisma.analysisRun.aggregate({ where: runClause, _avg: { executionTimeMs: true } }),
      prisma.analysisRun.aggregate({ where: runClause, _avg: { confidence: true } }),
      prisma.analysisRun.count({ where: { ...runClause, prLink: { not: null } } }),
      prisma.analysisRun.groupBy({
        by: ['category'],
        _count: { category: true },
        where: runClause,
        orderBy: { _count: { category: 'desc' } },
      }),
      prisma.analysisRun.groupBy({
        by: ['reviewRiskLevel'],
        _count: { reviewRiskLevel: true },
        where: { ...runClause, reviewRiskLevel: { not: null } },
        orderBy: { _count: { reviewRiskLevel: 'desc' } },
      }),
    ]);

    const successRate = totalRuns > 0 ? (approvedRuns / totalRuns) * 100 : 0;
    const rejectionRate = totalRuns > 0 ? (rejectedRuns / totalRuns) * 100 : 0;

    const categoryBreakdown: Record<string, number> = {};
    for (const g of categoryGroups) {
      if (g.category) categoryBreakdown[g.category] = g._count.category;
    }

    const riskLevelBreakdown: Record<string, number> = {};
    for (const g of riskGroups) {
      if (g.reviewRiskLevel) riskLevelBreakdown[g.reviewRiskLevel] = g._count.reviewRiskLevel;
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
