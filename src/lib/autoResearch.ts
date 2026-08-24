import { readSessionCredential } from './cloudflareWorkspace';

export interface AutoResearchResult {
  mode: 'infinity-canvas' | 'repository-grounded';
  text: string;
  sources: Array<{ path: string; url: string }>;
}

export async function researchBeforeFix(repo: { name: string }, details: { commitMessage?: string; scenario?: string; code?: string }): Promise<AutoResearchResult> {
  const topic = [
    `Repository: ${repo.name}`,
    `Commit: ${details.commitMessage || 'automatic bug scan'}`,
    `Scenario: ${details.scenario || 'find broken behavior and safe code-quality improvements'}`,
    `Affected code:\n${(details.code || '').slice(0, 3500)}`,
  ].join('\n');
  const githubToken = readSessionCredential('dbugger_github_token', 'repoheal_github_token');

  let response: Response;
  try {
    response = await fetch('/api/research/gridscape', {
      method: 'POST',
      credentials: 'include',
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic, githubToken }),
    });
  } catch (error: any) {
    throw new Error(`Gridscape research failed: ${error?.message || 'request failed'}`);
  }

  const payload = await response.json().catch(() => ({}));
  if (!response.ok || typeof payload.text !== 'string' || !payload.text.trim()) {
    throw new Error(`Gridscape research failed: ${payload.error || `research route returned ${response.status}`}`);
  }

  return {
    mode: payload.mode === 'infinity-canvas' ? 'infinity-canvas' : 'repository-grounded',
    text: payload.text.slice(0, 14000),
    sources: Array.isArray(payload.sources) ? payload.sources.slice(0, 10) : [],
  };
}
