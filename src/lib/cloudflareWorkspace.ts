import type { BugFixRun, DaemonLog, MonitoredRepo } from '../types';

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

function normalizeLegacyLog(log: DaemonLog): DaemonLog {
  const legacyPattern = /(24\/7 autonomous|GitHub MCP bridge mounted|OpenRouter Free High-Context Models synchronized|GitHub MCP Tool Executed|Revert PR|Pushed & Merged)/i;
  return legacyPattern.test(log.message || '')
    ? { ...log, level: 'warn', message: `Legacy record retained for audit only; not independently verified: ${log.message}` }
    : log;
}

function normalizeLegacyRun(run: BugFixRun): BugFixRun {
  const verifiedDelivery = hasVerifiedDeliveryEvidence(run);
  const validationEvidence = Array.isArray(run.mcpToolLogs) && run.mcpToolLogs.some((log: any) =>
    ['validation', 'test_run', 'ci_result'].includes(log?.tool) && log?.output?.verified === true
  );
  const existingPipeline: any = run.pipeline || {};
  if (verifiedDelivery) {
    return {
      ...run,
      pipeline: validationEvidence ? { ...existingPipeline, passed: false } : { ...existingPipeline, passed: false, overallScore: 0 },
      canUndo: Boolean(run.canUndo),
    } as BugFixRun;
  }
  const legalRiskCheck = existingPipeline.legalRiskCheck || {};
  return {
    ...run,
    status: verifiedDelivery ? 'awaiting_human_review' : (run.isUndone || run.status === 'undone' ? 'awaiting_human_review' : run.status),
    pullRequestUrl: verifiedDelivery ? run.pullRequestUrl : undefined,
    pullRequestNumber: verifiedDelivery ? run.pullRequestNumber : undefined,
    pushedCommitSha: verifiedDelivery ? run.pushedCommitSha : undefined,
    revertPrUrl: undefined,
    isUndone: verifiedDelivery ? run.isUndone : undefined,
    canUndo: verifiedDelivery ? Boolean(run.canUndo) : false,
    pipeline: {
      ...existingPipeline,
      passed: false,
      overallScore: validationEvidence ? (typeof existingPipeline.overallScore === 'number' ? existingPipeline.overallScore : 0) : 0,
      astSyntaxCheck: validationEvidence ? existingPipeline.astSyntaxCheck : { status: 'warning', message: 'No independent AST/type-check evidence was stored.', score: 0 },
      securityVulnerabilityScan: validationEvidence ? existingPipeline.securityVulnerabilityScan : { status: 'warning', vulnerabilitiesFound: [], score: 0 },
      legalRiskCheck: validationEvidence ? legalRiskCheck : {
        status: 'warning',
        score: 0,
        licenseContamination: { status: 'warning', detectedLicenses: [], viralRisk: false, detail: 'No independent license scan evidence was stored.' },
        secretLeakGuard: { status: 'failed', secretsFound: [], detail: 'No independent secret scan evidence was stored.' },
        copyrightIntegrity: { status: 'warning', uncreditedCopyDetected: false, detail: 'No independent copyright scan evidence was stored.' },
        complianceFrameworks: [],
        legalSignoffSummary: 'Not independently verified; human or CI review is required.',
      },
      unitTestVerification: validationEvidence ? existingPipeline.unitTestVerification : { status: 'warning', testsRun: 0, testsPassed: 0, score: 0 },
      dependencyCheck: validationEvidence ? existingPipeline.dependencyCheck : { status: 'warning', dependenciesAudited: 0, score: 0 },
      breakingChangeCheck: validationEvidence ? existingPipeline.breakingChangeCheck : { status: 'warning', apiContractsPreserved: false, score: 0 },
      regressionGuard: validationEvidence ? existingPipeline.regressionGuard : { status: 'warning', confidence: 0 },
    },
  } as BugFixRun;
}

export async function loadCloudflareWorkspace(): Promise<WorkspaceState | null> {
  try {
    const payload = await request('/api/workspace/state');
    const state = payload?.state as WorkspaceState | undefined;
    return state ? {
      ...state,
      fixRuns: Array.isArray(state.fixRuns) ? state.fixRuns.map(normalizeLegacyRun) : [],
      logs: Array.isArray(state.logs) ? state.logs.map(normalizeLegacyLog) : [],
    } : null;
  } catch (error) {
    console.warn('Cloudflare workspace unavailable; using local/Firebase fallback.', error);
    return null;
  }
}

export async function saveCloudflareWorkspace(state: WorkspaceState) {
  try {
    await request('/api/workspace/state', { method: 'PUT', body: JSON.stringify({ state: { ...state, updatedAt: Date.now() } }) });
  } catch (error) {
    console.warn('Cloudflare workspace save failed; local UI state remains active.', error);
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
