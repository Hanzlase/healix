import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { createLogger, getRequestId } from '@/lib/logger';
import { checkRateLimit, getClientId, getRateLimitConfig } from '@/lib/rate-limit';

export async function POST(req: Request) {
  const requestId = getRequestId(req);
  const log = createLogger({ requestId, route: 'auth/signup' });

  const rateConfig = getRateLimitConfig();
  if (rateConfig.enabled) {
    const rate = checkRateLimit({
      key: `signup:${getClientId(req)}`,
      limit: Math.max(5, Math.floor(rateConfig.limit / 2)),
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
    const { name, email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400, headers: { 'x-request-id': requestId } }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400, headers: { 'x-request-id': requestId } }
      );
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const user = await prisma.user.create({
      data: {
        name: name || undefined,
        email: email.toLowerCase().trim(),
        passwordHash,
      },
    });

    return NextResponse.json(
      { success: true, user: { id: user.id, email: user.email, name: user.name } },
      { headers: { 'x-request-id': requestId } }
    );
  } catch (error: any) {
    log.error('Signup error', {}, error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: { 'x-request-id': requestId } }
    );
  }
}
