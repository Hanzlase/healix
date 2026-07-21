import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ failureId: string }> }
) {
  try {
    const { failureId } = await params;

    if (!failureId) {
      return NextResponse.json({ error: 'Missing failure ID' }, { status: 400 });
    }

    const session = await getServerSession(authOptions);

    // Verify ownership if user is authenticated
    if (session?.user && (session.user as any).id) {
      const failure = await prisma.pipelineFailure.findUnique({
        where: { id: failureId },
        include: { repository: true },
      });

      if (failure && failure.repository.userId !== (session.user as any).id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
    }

    // Delete associated analysis runs first, then the failure
    await prisma.analysisRun.deleteMany({
      where: { failureId },
    });

    await prisma.pipelineFailure.delete({
      where: { id: failureId },
    });

    return NextResponse.json({ success: true, message: 'Failure deleted successfully' });
  } catch (error) {
    console.error('[DELETE failure] Error:', error);
    return NextResponse.json({ error: 'Failed to delete failure' }, { status: 500 });
  }
}
