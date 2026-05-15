import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ runId: string }> }
) {
  try {
    const { runId } = await params;
    const session = await getServerSession(authOptions);

    const run = await prisma.analysisRun.findUnique({
      where: { id: runId },
      include: {
        failure: {
          include: { repository: true },
        },
      },
    });

    if (!run) {
      return NextResponse.json({ error: 'Run not found' }, { status: 404 });
    }

    // Auth check — only owner or guest system user can view
    if (session?.user && (session.user as any).id) {
      if (run.failure.repository.userId !== (session.user as any).id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
    }

    return NextResponse.json(run);
  } catch (err) {
    console.error('Get run error:', err);
    return NextResponse.json({ error: 'Failed to fetch run' }, { status: 500 });
  }
}
