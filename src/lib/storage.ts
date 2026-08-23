import { getWorkspaceId } from './cloudflare';
import type { CheckRun, ConsoleEvent, MonitoredRepo, ResearchNote, UserSettings } from '../types';

const KEY = 'dbugger-state-v3';

type LocalState = { repos: MonitoredRepo[]; checks: CheckRun[]; console: ConsoleEvent[]; research: ResearchNote[]; settings: UserSettings };

export const emptyState = (): LocalState => ({ repos: [], checks: [], console: [], research: [], settings: { provider: 'openai-compatible', apiBaseUrl: 'https://api.openai.com/v1', model: 'gpt-4o-mini', researchEnabled: true, defaultBranch: 'main', learnWorkingStyle: true, theme: 'dark' } });

function readLocal(): LocalState {
  try { return { ...emptyState(), ...(JSON.parse(localStorage.getItem(KEY) || '{}')) }; } catch { return emptyState(); }
}
function writeLocal(state: LocalState) { localStorage.setItem(KEY, JSON.stringify(state)); }
function headers() { return { 'Content-Type': 'application/json', 'X-Workspace-Id': getWorkspaceId() }; }

export async function loadState(): Promise<LocalState> {
  const local = readLocal();
  try {
    const response = await fetch('/api/workspace/state', { headers: { 'X-Workspace-Id': getWorkspaceId() }, cache: 'no-store' });
    if (!response.ok) return local;
    const data = await response.json();
    if (!data.state) return local;
    const remote = { ...emptyState(), ...data.state } as LocalState;
    writeLocal(remote);
    return remote;
  } catch { return local; }
}

export async function persistState(state: LocalState) {
  writeLocal(state);
  try { await fetch('/api/workspace/state', { method: 'PUT', headers: headers(), body: JSON.stringify({ state }) }); } catch { /* Local persistence keeps the workspace usable when D1 is unavailable. */ }
}

export async function recordLearning(event: { type: string; metadata?: Record<string, unknown> }) {
  try { await fetch('/api/workspace/learn', { method: 'POST', headers: headers(), body: JSON.stringify(event) }); } catch { /* Learning is best effort and never blocks a code check. */ }
}
