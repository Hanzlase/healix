export type FailureStatus = 'pending' | 'analyzed';

export type GithubFailureEvent = {
  repoFullName: string; // owner/name
  repoName: string; // name
  owner: string;
  workflowRunId: number;
  runAttempt?: number;
  commitSha: string;
  failureTimestamp: string; // ISO
};

export type GithubContext = {
  repo: string;
  commit: string;
  logs: string;
  files: string[];
  error_summary: string;
};

export type AiReadyContext = {
  repo: string;
  commit: string;
  errorSummary: string;
  keyErrors: string[];
  stackTraces: string[];
  filePaths: string[];
  truncatedLog: string;
};

export type GeminiRootCause = {
  root_cause: string;
  category: 'runtime' | 'build' | 'dependency' | 'config';
  confidence: number;
  affected_file: string;
};
