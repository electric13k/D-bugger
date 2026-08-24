import type { MonitoredRepo } from '../types';
import { readSessionCredential } from './cloudflareWorkspace';

export interface AutoResearchResult {
  mode: 'infinity-canvas' | 'repository-grounded-preview' | 'local-context-fallback';
  text: string;
  sources: Array<{ path: string; url: string }>;
}

function localContextFallback(repo: MonitoredRepo, reason?: string): AutoResearchResult {
  const context = repo.contextAnalysis;
  return {
    mode: 'local-context-fallback',
    text: [
      `Automatic Gridscape research was unavailable for ${repo.name}${reason ? ` (${reason})` : ''}.`,
      context ? `Use the linked repository snapshot: ${context.architectureSummary} Technology: ${context.techStack.language}; runtime ${context.techStack.runtime}; package manager ${context.techStack.packageManager}. Prioritize critical modules ${context.criticalModules.map((item) => item.file).join(', ') || 'not yet indexed'}.` : 'No linked repository context is available yet; inspect the affected file and nearby tests before changing code.',
      'Fix broken behavior at the root cause first. For functioning code, make only low-risk, testable improvements that preserve public contracts, error handling, security boundaries, and existing architecture.',
    ].join('\n'),
    sources: [],
  };
}

export async function researchBeforeFix(repo: MonitoredRepo, details: { commitMessage?: string; scenario?: string; code?: string }): Promise<AutoResearchResult> {
  const topic = [
    `Repository: ${repo.name}`,
    `Commit: ${details.commitMessage || 'automatic bug scan'}`,
    `Scenario: ${details.scenario || 'find broken behavior and safe code-quality improvements'}`,
    `Affected code:\n${(details.code || '').slice(0, 3500)}`,
  ].join('\n');
  const githubToken = readSessionCredential('dbugger_github_token', 'repoheal_github_token');

  try {
    const response = await fetch('/api/research/gridscape', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic, githubToken }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || typeof payload.text !== 'string') {
      return localContextFallback(repo, payload.error || `research route returned ${response.status}`);
    }
    return {
      mode: payload.mode === 'infinity-canvas' ? 'infinity-canvas' : 'repository-grounded-preview',
      text: payload.text.slice(0, 14000),
      sources: Array.isArray(payload.sources) ? payload.sources.slice(0, 10) : [],
    };
  } catch (error: any) {
    return localContextFallback(repo, error?.message || 'research request failed');
  }
}
