import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const [
      totalRuns,
      approvedRuns,
      avgExecutionTime,
      avgConfidence,
      prsCreated,
    ] = await Promise.all([
      prisma.analysisRun.count(),
      prisma.analysisRun.count({ where: { reviewStatus: 'approved' } }),
      prisma.analysisRun.aggregate({ _avg: { executionTimeMs: true } }),
      prisma.analysisRun.aggregate({ _avg: { confidence: true } }),
      prisma.analysisRun.count({ where: { prLink: { not: null } } }),
    ]);

    const successRate = totalRuns > 0 ? (approvedRuns / totalRuns) * 100 : 0;

    return NextResponse.json({
      totalRuns,
      approvedRuns,
      successRate: Math.round(successRate),
      avgExecutionTimeMs: Math.round(avgExecutionTime._avg.executionTimeMs ?? 0),
      avgConfidence: ((avgConfidence._avg.confidence ?? 0) * 100).toFixed(1),
      prsCreated,
    });
  } catch (error) {
    console.error('[stats] Failed to fetch stats:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
