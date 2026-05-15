import crypto from 'crypto';
import { Octokit } from '@octokit/rest';
import { env } from '@/lib/env';

function getAppId(): string {
  if (!env.GITHUB_APP_ID) throw new Error('GITHUB_APP_ID is required for GitHub App auth');
  return env.GITHUB_APP_ID;
}

function getPrivateKeyPem(): string {
  if (!env.GITHUB_APP_PRIVATE_KEY) throw new Error('GITHUB_APP_PRIVATE_KEY is required for GitHub App auth');
  // Common deployment pattern: store PEM with \n escapes
  return env.GITHUB_APP_PRIVATE_KEY.includes('\\n')
    ? env.GITHUB_APP_PRIVATE_KEY.replace(/\\n/g, '\n')
    : env.GITHUB_APP_PRIVATE_KEY;
}

function base64Url(input: Buffer | string): string {
  const buf = typeof input === 'string' ? Buffer.from(input, 'utf8') : input;
  return buf
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function signJwtRs256(payload: Record<string, unknown>, privateKeyPem: string): string {
  const header = { alg: 'RS256', typ: 'JWT' };
  const encodedHeader = base64Url(JSON.stringify(header));
  const encodedPayload = base64Url(JSON.stringify(payload));
  const toSign = `${encodedHeader}.${encodedPayload}`;

  const signer = crypto.createSign('RSA-SHA256');
  signer.update(toSign);
  signer.end();
  const signature = signer.sign(privateKeyPem);

  return `${toSign}.${base64Url(signature)}`;
}

export function createAppJwt(): string {
  const now = Math.floor(Date.now() / 1000);
  // iat backdated slightly for clock skew; exp max 10 minutes per GitHub requirements
  const payload = {
    iat: now - 30,
    exp: now + 9 * 60,
    iss: getAppId(),
  };
  return signJwtRs256(payload, getPrivateKeyPem());
}

export async function getInstallationOctokit(installationId: number): Promise<Octokit> {
  const jwt = createAppJwt();
  const appOctokit = new Octokit({ auth: jwt });

  const tokenRes = await appOctokit.request(
    'POST /app/installations/{installation_id}/access_tokens',
    { installation_id: installationId }
  );

  const token = tokenRes.data.token;
  if (!token) throw new Error('Failed to create GitHub installation access token');

  return new Octokit({ auth: token });
}

export function getGitHubAppInstallUrl(): string | null {
  if (!env.GITHUB_APP_SLUG) return null;
  return `https://github.com/apps/${env.GITHUB_APP_SLUG}/installations/new`;
}
