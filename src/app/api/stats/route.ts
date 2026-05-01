import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const totalRuns = await prisma.analysisRun.count();
    const approvedRuns = await prisma.analysisRun.count({
      where: { reviewStatus: 'approved' },
    });
    
    const avgExecutionTime = await prisma.analysisRun.aggregate({
      _avg: {
        executionTimeMs: true,
      },
    });

    const avgConfidence = await prisma.analysisRun.aggregate({
      _avg: {
        confidence: true,
      },
    });

    const prsCreated = await prisma.analysisRun.count({
      where: {
        prLink: { not: null },
      },
    });

    const successRate = totalRuns > 0 ? (approvedRuns / totalRuns) * 100 : 0;

    return NextResponse.json({
      totalRuns,
      approvedRuns,
      successRate: Math.round(successRate),
      avgExecutionTimeMs: Math.round(avgExecutionTime._avg.executionTimeMs || 0),
      avgConfidence: (avgConfidence._avg.confidence || 0).toFixed(2),
      prsCreated,
    });
  } catch (error) {
    console.error('Failed to fetch stats:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
