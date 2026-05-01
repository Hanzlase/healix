import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const failureId = searchParams.get('failureId');

    const runs = await prisma.analysisRun.findMany({
      where: failureId ? { failureId } : {},
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json(runs);
  } catch (error) {
    console.error('Failed to fetch analysis runs:', error);
    return NextResponse.json({ error: 'Failed to fetch analysis runs' }, { status: 500 });
  }
}
