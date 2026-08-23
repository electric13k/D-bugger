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

export async function loadCloudflareWorkspace(): Promise<WorkspaceState | null> {
  try {
    const payload = await request('/api/workspace/state');
    return payload?.state || null;
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
