import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const UpdateRepoSchema = z.object({
  autoPrEnabled: z.boolean().optional(),
});

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ repoId: string }> }
) {
  try {
    const { repoId } = await params;
    const session = await getServerSession(authOptions);

    const repo = await prisma.repository.findUnique({
      where: { id: repoId },
      include: { user: true },
    });

    if (!repo) {
      return NextResponse.json({ error: 'Repository not found' }, { status: 404 });
    }

    if (session?.user && (session.user as any).id) {
      if (repo.userId !== (session.user as any).id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
    } else {
      if (repo.user.email !== 'system@healix.local') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
    }

    await prisma.repository.delete({ where: { id: repoId } });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Delete repository error:', err);
    return NextResponse.json({ error: 'Failed to delete repository' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ repoId: string }> }
) {
  try {
    const { repoId } = await params;
    const session = await getServerSession(authOptions);
    const body = await req.json();
    const parsed = UpdateRepoSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const repo = await prisma.repository.findUnique({
      where: { id: repoId },
      include: { user: true },
    });

    if (!repo) {
      return NextResponse.json({ error: 'Repository not found' }, { status: 404 });
    }

    if (session?.user && (session.user as any).id) {
      if (repo.userId !== (session.user as any).id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
    } else {
      if (repo.user.email !== 'system@healix.local') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
    }

    const updated = await prisma.repository.update({
      where: { id: repoId },
      data: parsed.data,
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error('Update repository error:', err);
    return NextResponse.json({ error: 'Failed to update repository' }, { status: 500 });
  }
}
