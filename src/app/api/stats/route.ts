import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(req.url);
    const guestReposParam = searchParams.get('repos');

    let userClause = {};
    if (session?.user && (session.user as any).id) {
      userClause = { failure: { repository: { userId: (session.user as any).id } } };
    } else if (guestReposParam) {
      const repos = guestReposParam.split(',');
      const systemEmail = 'system@healix.local';
      const sysUser = await prisma.user.findUnique({ where: { email: systemEmail } });
      if (!sysUser) return NextResponse.json({ totalRuns: 0, approvedRuns: 0, successRate: 0, avgExecutionTimeMs: 0, avgConfidence: '0.0', prsCreated: 0 });
      userClause = { failure: { repository: { userId: sysUser.id, repoName: { in: repos } } } };
    } else {
      return NextResponse.json({ totalRuns: 0, approvedRuns: 0, successRate: 0, avgExecutionTimeMs: 0, avgConfidence: '0.0', prsCreated: 0 });
    }

    const [
      totalRuns,
      approvedRuns,
      avgExecutionTime,
      avgConfidence,
      prsCreated,
    ] = await Promise.all([
      prisma.analysisRun.count({ where: userClause }),
      prisma.analysisRun.count({ where: { ...userClause, reviewStatus: 'approved' } }),
      prisma.analysisRun.aggregate({ where: userClause, _avg: { executionTimeMs: true } }),
      prisma.analysisRun.aggregate({ where: userClause, _avg: { confidence: true } }),
      prisma.analysisRun.count({ where: { ...userClause, prLink: { not: null } } }),
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
