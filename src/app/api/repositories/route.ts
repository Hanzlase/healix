import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createLogger, getRequestId } from '@/lib/logger';
import { checkRateLimit, getClientId, getRateLimitConfig } from '@/lib/rate-limit';

const AddRepoSchema = z.object({
  repoFullName: z.string().regex(/^[\w.-]+\/[\w.-]+$/),
  autoPrEnabled: z.boolean().optional().default(true),
  githubToken: z.string().optional().nullable(),
});

export async function GET(req: NextRequest) {
  const requestId = getRequestId(req);
  const log = createLogger({ requestId, route: 'repositories:get' });
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

    if (!user) return NextResponse.json([], { headers: { 'x-request-id': requestId } });

    const repos = await prisma.repository.findMany({
      where: { 
        userId: user.id,
        ...((session?.user && (session.user as any).id) ? {} : { repoName: { in: guestReposParam ? guestReposParam.split(',') : [] } })
      },
      include: { _count: { select: { failures: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(repos, { headers: { 'x-request-id': requestId } });
  } catch (err) {
    log.error('Failed to list repos', {}, err);
    return NextResponse.json(
      { error: 'Failed' },
      { status: 500, headers: { 'x-request-id': requestId } }
    );
  }
}

export async function POST(req: NextRequest) {
  const requestId = getRequestId(req);
  const log = createLogger({ requestId, route: 'repositories:post' });

  const rateConfig = getRateLimitConfig();
  if (rateConfig.enabled) {
    const rate = checkRateLimit({
      key: `repos:${getClientId(req)}`,
      limit: Math.max(10, Math.floor(rateConfig.limit / 2)),
      windowMs: rateConfig.windowMs,
    });
    if (!rate.ok) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        {
          status: 429,
          headers: {
            'Retry-After': Math.ceil((rate.resetAt - Date.now()) / 1000).toString(),
            'x-request-id': requestId,
          },
        }
      );
    }
  }

  try {
    const session = await getServerSession(authOptions);
    const body = await req.json();
    const parsed = AddRepoSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid' },
        { status: 400, headers: { 'x-request-id': requestId } }
      );
    }

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

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404, headers: { 'x-request-id': requestId } }
      );
    }

    const repo = await prisma.repository.upsert({
      where: { userId_repoName: { userId: user.id, repoName: parsed.data.repoFullName } },
      update: { 
        autoPrEnabled: parsed.data.autoPrEnabled,
        githubToken: parsed.data.githubToken ?? null,
      },
      create: {
        userId: user.id,
        repoName: parsed.data.repoFullName,
        repoOwner: owner,
        autoPrEnabled: parsed.data.autoPrEnabled,
        githubToken: parsed.data.githubToken ?? null,
      },
    });

    return NextResponse.json(repo, { status: 201, headers: { 'x-request-id': requestId } });
  } catch (err) {
    log.error('Failed to upsert repo', {}, err);
    return NextResponse.json(
      { error: 'Failed' },
      { status: 500, headers: { 'x-request-id': requestId } }
    );
  }
}
