import type { AiReadyContext, GithubContext } from '@/lib/types';

const MAX_LOG_CHARS = 18_000; // keep prompt small-ish

const noisePatterns: RegExp[] = [
  /^\s*Run \S+/i,
  /^\s*Post job cleanup\./i,
  /^\s*System\./i,
  /^\s*Downloading\s+/i,
  /^\s*Extracting\s+/i,
  /^\s*Added \d+ packages/i,
  /^\s*npm notice/i,
  /^\s*npm warn/i,
];

const errorLike = /(error|exception|failed|fatal|segmentation fault|traceback)/i;

function isNoise(line: string) {
  return noisePatterns.some((p) => p.test(line));
}

function extractFilePaths(text: string): string[] {
  const matches = text.match(/([A-Za-z]:\\[^\s:]+\.(ts|tsx|js|jsx|json|yml|yaml|md))|((?:src|app|pages|lib)\/[^\s:]+\.(ts|tsx|js|jsx|json))/g);
  return Array.from(new Set((matches ?? []).map((m) => m.replace(/\\/g, '/')))).slice(0, 50);
}

function extractStackTraces(lines: string[]): string[] {
  const traces: string[] = [];
  let current: string[] = [];

  const isStackLine = (l: string) =>
    /^\s*at\s+.+\(.+\)$/.test(l) ||
    /^\s*at\s+.+$/.test(l) ||
    /^\s*File ".+", line \d+/.test(l);

  for (const line of lines) {
    if (isStackLine(line)) {
      current.push(line);
      continue;
    }

    if (current.length) {
      traces.push(current.join('\n'));
      current = [];
    }
  }

  if (current.length) traces.push(current.join('\n'));
  return traces.slice(0, 10);
}

export function toAiReadyContext(ctx: GithubContext): AiReadyContext {
  const lines = ctx.logs.split(/\r?\n/);

  const kept: string[] = [];
  const keyErrors: string[] = [];

  for (const raw of lines) {
    const line = raw.slice(0, 4000); // avoid pathological lines
    if (!line.trim()) continue;
    if (isNoise(line)) continue;

    if (errorLike.test(line)) {
      keyErrors.push(line.trim());
      kept.push(line);
      continue;
    }

    // Keep some context around errors by retaining non-noise lines near error-like blocks
    if (kept.length && kept.length < 2000) kept.push(line);
  }

  const truncatedLog = kept.join('\n').slice(0, MAX_LOG_CHARS);

  const filePaths = Array.from(new Set([...(ctx.files ?? []), ...extractFilePaths(truncatedLog)])).slice(0, 50);
  const stackTraces = extractStackTraces(kept);

  return {
    repo: ctx.repo,
    commit: ctx.commit,
    errorSummary: ctx.error_summary,
    keyErrors: Array.from(new Set(keyErrors)).slice(0, 50),
    stackTraces,
    filePaths,
    truncatedLog,
  };
}
