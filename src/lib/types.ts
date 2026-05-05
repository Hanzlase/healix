export type FailureStatus = 'pending' | 'analyzing' | 'analyzed' | 'failed';

export type GithubFailureEvent = {
  repoFullName: string; // owner/name
  repoName: string; // name
  owner: string;
  workflowRunId: number;
  workflowName?: string;
  branchName?: string;
  runAttempt?: number;
  commitSha: string;
  failureTimestamp: string; // ISO
};

export type GithubContext = {
  repo: string;
  commit: string;
  logs: string;        // raw text (decoded) or base64 zip
  logsIsZip: boolean;  // true if logs is still base64-encoded zip
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

export type PatchReview = {
  status: 'approved' | 'rejected';
  reason: string;
  risk_level: 'low' | 'medium' | 'high';
};

export type HealixPipelineResult = {
  root: GeminiRootCause;
  patch: { patch: string };
  review: PatchReview;
  prUrl: string | null;
  execution_time_ms: number;
  analysisRunId: string;
};

// Analytics types
export type AnalyticsStats = {
  totalFailures: number;
  totalRuns: number;
  approvedRuns: number;
  rejectedRuns: number;
  successRate: number;
  rejectionRate: number;
  avgExecutionTimeMs: number;
  avgConfidence: string;
  prsCreated: number;
  categoryBreakdown: Record<string, number>;
  riskLevelBreakdown: Record<string, number>;
};
