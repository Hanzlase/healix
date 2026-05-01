import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const failures = await prisma.pipelineFailure.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        repository: true,
        analysisRuns: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    return NextResponse.json(failures);
  } catch (error) {
    console.error('Failed to fetch failures:', error);
    return NextResponse.json({ error: 'Failed to fetch failures' }, { status: 500 });
  }
}
