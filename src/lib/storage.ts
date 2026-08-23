import { supabase } from './supabase';
import type { CheckRun, ConsoleEvent, MonitoredRepo, ResearchNote, UserSettings } from '../types';

const KEY = 'dbugger-state-v2';

type LocalState = { repos: MonitoredRepo[]; checks: CheckRun[]; console: ConsoleEvent[]; research: ResearchNote[]; settings: UserSettings };

export const emptyState = (): LocalState => ({ repos: [], checks: [], console: [], research: [], settings: { provider: 'openai-compatible', apiBaseUrl: 'https://api.openai.com/v1', model: 'gpt-4o-mini', researchEnabled: true, defaultBranch: 'main', learnWorkingStyle: true, theme: 'dark' } });

function readLocal(): LocalState {
  try { return { ...emptyState(), ...(JSON.parse(localStorage.getItem(KEY) || '{}')) }; } catch { return emptyState(); }
}
function writeLocal(state: LocalState) { localStorage.setItem(KEY, JSON.stringify(state)); }

export async function loadState(): Promise<LocalState> {
  const local = readLocal();
  if (!supabase) return local;
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return local;
  const userId = userData.user.id;
  const [repos, checks, research, preferences] = await Promise.all([
    supabase.from('monitored_repos').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
    supabase.from('check_runs').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(100),
    supabase.from('research_notes').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(50),
    supabase.from('user_preferences').select('settings').eq('user_id', userId).maybeSingle(),
  ]);
  return {
    repos: repos.data?.map((row: any) => row.payload as MonitoredRepo) || local.repos,
    checks: checks.data?.map((row: any) => row.payload as CheckRun) || local.checks,
    console: local.console,
    research: research.data?.map((row: any) => row.payload as ResearchNote) || local.research,
    settings: (preferences.data?.settings as UserSettings) || local.settings,
  };
}

export async function persistState(state: LocalState) {
  writeLocal(state);
  if (!supabase) return;
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return;
  const userId = userData.user.id;
  await Promise.all([
    ...state.repos.map(repo => supabase.from('monitored_repos').upsert({ id: repo.id, user_id: userId, repo_name: repo.fullName, payload: repo, updated_at: new Date().toISOString() })),
    ...state.checks.slice(0, 100).map(check => supabase.from('check_runs').upsert({ id: check.id, user_id: userId, repo_name: check.repoName, commit_sha: check.commitSha, payload: check, created_at: new Date(check.createdAt).toISOString() })),
    ...state.research.slice(0, 50).map(note => supabase.from('research_notes').upsert({ id: note.id, user_id: userId, query: note.query, payload: note, created_at: new Date(note.createdAt).toISOString() })),
    supabase.from('user_preferences').upsert({ user_id: userId, settings: state.settings, updated_at: new Date().toISOString() }),
  ]);
}

export async function recordLearning(event: { type: string; metadata?: Record<string, unknown> }) {
  if (!supabase) return;
  const { data } = await supabase.auth.getUser();
  if (!data.user) return;
  await supabase.from('working_style_events').insert({ user_id: data.user.id, event_type: event.type, metadata: event.metadata || {} });
}
