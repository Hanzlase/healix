import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const limit = Math.min(Number(searchParams.get('limit') ?? 20), 100);
    const cursor = searchParams.get('cursor');
    const guestReposParam = searchParams.get('repos');

    let userClause = {};
    if (session?.user && (session.user as any).id) {
      userClause = { repository: { userId: (session.user as any).id } };
    } else {
      const systemEmail = 'system@healix.local';
      const sysUser = await prisma.user.findUnique({ where: { email: systemEmail } });
      if (!sysUser) return NextResponse.json({ failures: [], nextCursor: null });

      const repos = guestReposParam ? guestReposParam.split(',').filter(Boolean) : [];
      if (repos.length > 0) {
        userClause = { repository: { userId: sysUser.id, repoName: { in: repos } } };
      } else {
        // Default to all failures associated with system repositories so visitors see full live demo data
        userClause = { repository: { userId: sysUser.id } };
      }
    }

    const failures = await prisma.pipelineFailure.findMany({
      where: {
        ...(status ? { status: status as any } : {}),
        ...userClause,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      include: {
        repository: {
          select: {
            id: true,
            repoName: true,
            repoOwner: true,
            autoPrEnabled: true,
          },
        },
        analysisRuns: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            id: true,
            failureId: true,
            rootCause: true,
            category: true,
            confidence: true,
            affectedFile: true,
            patch: true,
            reviewStatus: true,
            reviewReason: true,
            reviewRiskLevel: true,
            prLink: true,
            prBranch: true,
            executionTimeMs: true,
            pipelineStage: true,
            createdAt: true,
          },
        },
      },
    });

    const nextCursor = failures.length === limit ? failures[failures.length - 1].id : null;

    return NextResponse.json({ failures, nextCursor });
  } catch (error) {
    console.error('[failures] Failed to fetch:', error);
    return NextResponse.json({ error: 'Failed to fetch failures' }, { status: 500 });
  }
}
