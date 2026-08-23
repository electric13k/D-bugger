export type CheckStatus = 'passed' | 'warning' | 'failed' | 'running';

export interface RepoContextAnalysis {
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  indexedAt: number;
  techStack: { language: string; frameworks: string[]; packageManager: string; runtime: string };
  filesIndexed: number;
  symbolCount: number;
  astHealthScore: number;
  criticalModules: Array<{ file: string; complexity: 'high' | 'medium' | 'low'; riskFactor: string }>;
  vulnerabilityHotspots: Array<{ category: string; file: string; risk: 'critical' | 'high' | 'medium'; description: string }>;
  architectureSummary: string;
  contributorSignature: string;
}

export interface MonitoredRepo {
  id: string;
  fullName: string;
  owner: string;
  repo: string;
  branch: string;
  url: string;
  status: 'monitoring' | 'analyzing' | 'fixing' | 'idle' | 'error';
  autoSweepOnPush: boolean;
  includeCoAuthorAttribution: boolean;
  autoMode: 'pr_only' | 'pr_and_push' | 'review_required';
  securityThreshold: number;
  lastCommitSha?: string;
  lastCommitMessage?: string;
  lastCheckedAt?: number;
  totalChecks: number;
  contextAnalysis?: RepoContextAnalysis;
  webhookSecret?: string;
  webhookConfigured?: boolean;
}

export interface CheckRun {
  id: string;
  repoId: string;
  repoName: string;
  commitSha: string;
  commitMessage: string;
  commitAuthor: string;
  createdAt: number;
  status: 'passed' | 'warning' | 'failed' | 'awaiting_review';
  score: number;
  findings: Array<{ id: string; severity: 'critical' | 'high' | 'medium' | 'low'; title: string; file: string; detail: string; fix?: string }>;
  summary: string;
  coAuthorAttribution?: string;
  changedFiles: string[];
  pipeline: Array<{ label: string; status: CheckStatus; score: number; detail: string }>;
}

export interface ConsoleEvent {
  id: string;
  createdAt: number;
  level: 'info' | 'success' | 'warning' | 'error' | 'command' | 'agent';
  title: string;
  text: string;
  command?: string;
  output?: string;
  repoName?: string;
}

export interface ResearchNote {
  id: string;
  query: string;
  answer: string;
  sources: Array<{ title: string; url: string; snippet?: string }>;
  createdAt: number;
  linkedRepo?: string;
  gridscapeUrl: string;
}

export interface UserSettings {
  provider: 'openai-compatible' | 'anthropic-compatible';
  apiBaseUrl: string;
  model: string;
  apiKey?: string;
  githubToken?: string;
  displayName?: string;
  researchEnabled: boolean;
  defaultBranch: string;
  learnWorkingStyle: boolean;
  theme: 'dark' | 'light';
}

export const DEFAULT_SETTINGS: UserSettings = {
  provider: 'openai-compatible',
  apiBaseUrl: 'https://api.openai.com/v1',
  model: 'gpt-4o-mini',
  researchEnabled: true,
  defaultBranch: 'main',
  learnWorkingStyle: true,
  theme: 'dark',
};
