import { NextResponse } from 'next/server';
import { z } from 'zod';

// Guest session is stored client-side in localStorage.
// This endpoint exists to validate/normalize payloads and allow future server sync.

const GuestSessionSchema = z.object({
  mode: z.literal('guest'),
  repoFullName: z.string().optional(),
  recentFailures: z.array(z.string()).default([]),
  analysisHistory: z
    .array(
      z.object({
        failureId: z.string(),
        createdAt: z.string(),
        root_cause: z.string(),
        category: z.string(),
        confidence: z.number(),
        affected_file: z.string(),
      })
    )
    .default([]),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = GuestSessionSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: false, error: 'Invalid session payload' }, { status: 400 });
  return NextResponse.json({ ok: true, session: parsed.data }, { status: 200 });
}
