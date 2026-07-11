import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  // Optional: restrict config exposure to authenticated sessions if needed, 
  // but since we allow Guest mode, we can return it.
  const webhookSecret = process.env.GITHUB_WEBHOOK_SECRET || 'healix_super_secret_123';
  
  return NextResponse.json({
    webhookSecret,
  });
}
