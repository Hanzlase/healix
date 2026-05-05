import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
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
      prisma.pipelineFailure.count(),
      prisma.analysisRun.count(),
      prisma.analysisRun.count({ where: { reviewStatus: 'approved' } }),
      prisma.analysisRun.count({ where: { reviewStatus: 'rejected' } }),
      prisma.analysisRun.aggregate({ _avg: { executionTimeMs: true } }),
      prisma.analysisRun.aggregate({ _avg: { confidence: true } }),
      prisma.analysisRun.count({ where: { prLink: { not: null } } }),
      prisma.analysisRun.groupBy({
        by: ['category'],
        _count: { category: true },
        orderBy: { _count: { category: 'desc' } },
      }),
      prisma.analysisRun.groupBy({
        by: ['reviewRiskLevel'],
        _count: { reviewRiskLevel: true },
        where: { reviewRiskLevel: { not: null } },
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
