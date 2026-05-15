import { NextResponse } from 'next/server';
import { getGitHubAppInstallUrl } from '@/lib/github-app';

export async function GET() {
  return NextResponse.json({ installUrl: getGitHubAppInstallUrl() }, { status: 200 });
}
