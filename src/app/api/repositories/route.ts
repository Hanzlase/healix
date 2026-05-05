import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const AddRepoSchema = z.object({
  repoFullName: z.string().regex(/^[\w.-]+\/[\w.-]+$/),
  autoPrEnabled: z.boolean().optional().default(true),
});

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(req.url);
    const guestReposParam = searchParams.get('repos');

    let user;
    if (session?.user && (session.user as any).id) {
      user = await prisma.user.findUnique({ where: { id: (session.user as any).id } });
    } else {
      const systemEmail = 'system@healix.local';
      user = await prisma.user.findUnique({ where: { email: systemEmail } });
    }

    if (!user) return NextResponse.json([]);

    const repos = await prisma.repository.findMany({
      where: { 
        userId: user.id,
        ...((session?.user && (session.user as any).id) ? {} : { repoName: { in: guestReposParam ? guestReposParam.split(',') : [] } })
      },
      include: { _count: { select: { failures: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(repos);
  } catch (err) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await req.json();
    const parsed = AddRepoSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'Invalid' }, { status: 400 });

    const [owner, repoName] = parsed.data.repoFullName.split('/');
    
    let user;
    if (session?.user && (session.user as any).id) {
      user = await prisma.user.findUnique({ where: { id: (session.user as any).id } });
    } else {
      const systemEmail = 'system@healix.local';
      user = await prisma.user.upsert({
        where: { email: systemEmail },
        update: {},
        create: { email: systemEmail },
      });
    }

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const repo = await prisma.repository.upsert({
      where: { userId_repoName: { userId: user.id, repoName: parsed.data.repoFullName } },
      update: { autoPrEnabled: parsed.data.autoPrEnabled },
      create: {
        userId: user.id,
        repoName: parsed.data.repoFullName,
        repoOwner: owner,
        autoPrEnabled: parsed.data.autoPrEnabled,
      },
    });

    return NextResponse.json(repo, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
