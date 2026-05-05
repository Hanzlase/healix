import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const AddRepoSchema = z.object({
  repoFullName: z.string().regex(/^[\w.-]+\/[\w.-]+$/),
  autoPrEnabled: z.boolean().optional().default(true),
});

export async function GET() {
  try {
    const systemEmail = 'system@healix.local';
    const user = await prisma.user.findUnique({ where: { email: systemEmail } });
    if (!user) return NextResponse.json([]);

    const repos = await prisma.repository.findMany({
      where: { userId: user.id },
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
    const body = await req.json();
    const parsed = AddRepoSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'Invalid' }, { status: 400 });

    const [owner, repoName] = parsed.data.repoFullName.split('/');
    const systemEmail = 'system@healix.local';
    const user = await prisma.user.upsert({
      where: { email: systemEmail },
      update: {},
      create: { email: systemEmail },
    });

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
