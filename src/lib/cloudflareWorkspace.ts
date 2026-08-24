import { BugFixRun, DaemonLog, MonitoredRepo } from '../types';

export interface WorkspaceState {
  repos: MonitoredRepo[];
  fixRuns: BugFixRun[];
  logs: DaemonLog[];
  daemonRunning: boolean;
  updatedAt?: number;
}

const WORKSPACE_KEY = 'dbugger_workspace_id';

export function getWorkspaceId() {
  if (typeof window === 'undefined') return 'server-workspace';
  const existing = window.localStorage.getItem(WORKSPACE_KEY);
  if (existing) return existing;
  const created = `ws-${crypto.randomUUID()}`;
  window.localStorage.setItem(WORKSPACE_KEY, created);
  return created;
}

export function setWorkspaceId(workspaceId: string) {
  if (typeof window !== 'undefined' && workspaceId) window.localStorage.setItem(WORKSPACE_KEY, workspaceId);
}

async function request(path: string, init?: RequestInit) {
  const response = await fetch(path, {
    ...init,
    headers: { 'Content-Type': 'application/json', 'X-Workspace-Id': getWorkspaceId(), ...(init?.headers || {}) },
  });
  if (response.status === 404 || response.status === 501) return null;
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || `Workspace request failed (${response.status})`);
  return payload;
}

function hasVerifiedDeliveryEvidence(run: any) {
  return Boolean(
    run?.pullRequestUrl &&
    run?.pullRequestNumber &&
    run?.pushedCommitSha &&
    Array.isArray(run?.mcpToolLogs) &&
    run.mcpToolLogs.some((log: any) =>
      ['create_branch', 'commit_file', 'create_pull_request'].includes(log?.tool) && log?.output?.verified === true
    )
  );
}

function isConnectedRepositoryRecord(repo: any) {
  return Boolean(repo?.isLive === true && typeof repo?.owner === 'string' && repo.owner && typeof repo?.repo === 'string' && repo.repo);
}

function isRealRunRecord(run: any) {
  const hasRealModelResponse = Array.isArray(run?.mcpToolLogs) && run.mcpToolLogs.some((log: any) =>
    log?.tool === 'ai_analysis' && log?.output?.responseReceived === true && log?.output?.mode === 'openrouter-user-key-v2'
  );
  return Boolean(
    run &&
    typeof run.repoName === 'string' &&
    typeof run.commitSha === 'string' &&
    run.commitSha.length >= 20 &&
    (hasRealModelResponse || hasVerifiedDeliveryEvidence(run))
  );
}

function normalizeRunEvidence(run: BugFixRun): BugFixRun {
  const verifiedDelivery = hasVerifiedDeliveryEvidence(run);
  const pipeline: any = run.pipeline || {};
  return {
    ...run,
    status: verifiedDelivery ? run.status : 'awaiting_human_review',
    pullRequestUrl: verifiedDelivery ? run.pullRequestUrl : undefined,
    pullRequestNumber: verifiedDelivery ? run.pullRequestNumber : undefined,
    pushedCommitSha: verifiedDelivery ? run.pushedCommitSha : undefined,
    revertPrUrl: undefined,
    canUndo: verifiedDelivery && Boolean(run.canUndo),
    pipeline: {
      ...pipeline,
      passed: false,
      overallScore: 0,
    },
    mcpToolLogs: (Array.isArray(run.mcpToolLogs) ? run.mcpToolLogs : []).filter((log: any) =>
      verifiedDelivery || !['create_branch', 'commit_file', 'create_pull_request', 'revert_commit', 'github_delivery'].includes(log?.tool)
    ),
  } as BugFixRun;
}

export async function loadCloudflareWorkspace(): Promise<WorkspaceState | null> {
  try {
    const payload = await request('/api/workspace/state');
    const state = payload?.state as WorkspaceState | undefined;
    return state ? {
      ...state,
      repos: Array.isArray(state.repos) ? state.repos.filter(isConnectedRepositoryRecord) : [],
      fixRuns: Array.isArray(state.fixRuns) ? state.fixRuns.filter(isRealRunRecord).map(normalizeRunEvidence) : [],
      // Start with current telemetry only; removed execution paths must not reappear after reload.
      logs: [],
    } : null;
  } catch (error) {
    console.warn('Cloudflare workspace unavailable; no workspace state was loaded.', error);
    return null;
  }
}

export async function saveCloudflareWorkspace(state: WorkspaceState) {
  try {
    await request('/api/workspace/state', { method: 'PUT', body: JSON.stringify({ state: { ...state, updatedAt: Date.now() } }) });
  } catch (error) {
    console.warn('Cloudflare workspace save failed; changes were not persisted.', error);
  }
}

export async function recordCloudflareWorkingStyle(event: { type: string; metadata?: Record<string, unknown> }) {
  try {
    await request('/api/workspace/learn', { method: 'POST', body: JSON.stringify(event) });
  } catch (error) {
    console.warn('Working-style event was not persisted.', error);
  }
}

export function readSessionCredential(key: string, legacyKey?: string) {
  if (typeof window === 'undefined') return '';
  return window.sessionStorage.getItem(key) || (legacyKey ? window.localStorage.getItem(legacyKey) || '' : '');
}
