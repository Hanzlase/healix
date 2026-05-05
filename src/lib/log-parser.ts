import type { AiReadyContext, GithubContext } from '@/lib/types';

const MAX_LOG_CHARS = 18_000;

const noisePatterns: RegExp[] = [
  /^\s*Run \S+/i,
  /^\s*Post job cleanup\./i,
  /^\s*System\./i,
  /^\s*Downloading\s+/i,
  /^\s*Extracting\s+/i,
  /^\s*Added \d+ packages/i,
  /^\s*npm notice/i,
  /^\s*npm warn/i,
  /^\s*\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d+Z\s*$/,  // bare timestamps
  /^\s*##\[group\]/i,
  /^\s*##\[endgroup\]/i,
  /^\s*##\[debug\]/i,
];

const errorLike = /(error|exception|failed|fatal|segmentation fault|traceback|abort|panic|critical)/i;

function isNoise(line: string) {
  return noisePatterns.some((p) => p.test(line));
}

function extractFilePaths(text: string): string[] {
  const matches = text.match(
    /([A-Za-z]:\\[^\s:]+\.(ts|tsx|js|jsx|json|yml|yaml|md|py|go|rb|java|cs|rs))|((src|app|pages|lib|test|tests|spec|pkg|cmd)\/[^\s:]+\.(ts|tsx|js|jsx|json|py|go|rb|java|cs|rs))/g
  );
  return Array.from(new Set((matches ?? []).map((m) => m.replace(/\\/g, '/')))).slice(0, 50);
}

function extractStackTraces(lines: string[]): string[] {
  const traces: string[] = [];
  let current: string[] = [];

  const isStackLine = (l: string) =>
    /^\s*at\s+.+\(.+\)$/.test(l) ||
    /^\s*at\s+.+$/.test(l) ||
    /^\s*File ".+", line \d+/.test(l) ||
    /^\s+in\s+.+$/.test(l);

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

/**
 * Strips the GitHub Actions timestamp prefix from log lines.
 * Format: "2024-01-15T10:23:45.1234567Z " or "2024-01-15T10:23:45Z "
 */
function stripTimestamp(line: string): string {
  return line.replace(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z\s/, '');
}

export function toAiReadyContext(ctx: GithubContext): AiReadyContext {
  const rawLines = ctx.logs.split(/\r?\n/);

  const kept: string[] = [];
  const keyErrors: string[] = [];

  for (const raw of rawLines) {
    const clean = stripTimestamp(raw).slice(0, 4000); // strip GH timestamps + cap line length
    if (!clean.trim()) continue;
    if (isNoise(clean)) continue;

    if (errorLike.test(clean)) {
      keyErrors.push(clean.trim());
      kept.push(clean);
      continue;
    }

    // Keep context lines up to reasonable size
    if (kept.length < 2000) kept.push(clean);
  }

  const truncatedLog = kept.join('\n').slice(0, MAX_LOG_CHARS);

  const filePaths = Array.from(
    new Set([...(ctx.files ?? []), ...extractFilePaths(truncatedLog)])
  ).slice(0, 50);

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
