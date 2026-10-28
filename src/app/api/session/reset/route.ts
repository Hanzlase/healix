import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST() {
  try {
    const session = await getServerSession(authOptions);

    if (session?.user && (session.user as { id?: string }).id) {
      const userId = (session.user as { id: string }).id;
      const userRepos = await prisma.repository.findMany({
        where: { userId },
        select: { id: true },
      });
      const repoIds = userRepos.map((r) => r.id);
      if (repoIds.length > 0) {
        await prisma.pipelineFailure.deleteMany({
          where: { repoId: { in: repoIds } },
        });
      }
    } else {
      // Guest / Local Sandbox Mode: Reset all system demo failures and runs
      const systemEmail = 'system@healix.local';
      const sysUser = await prisma.user.findUnique({
        where: { email: systemEmail },
        include: { repositories: true },
      });

      if (sysUser) {
        const repoIds = sysUser.repositories.map((r) => r.id);
        if (repoIds.length > 0) {
          await prisma.pipelineFailure.deleteMany({
            where: { repoId: { in: repoIds } },
          });
        }
        // Remove dynamically created simulated repositories, keeping healix-demo
        await prisma.repository.deleteMany({
          where: {
            userId: sysUser.id,
            repoName: { not: 'healix-demo' },
          },
        });
      }
    }

    return NextResponse.json({ ok: true, message: 'Sandbox demo session reset successfully' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to reset session data';
    console.error('[session/reset] Error resetting session:', error);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
