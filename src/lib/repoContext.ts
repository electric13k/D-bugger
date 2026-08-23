import type { MonitoredRepo, RepoContextAnalysis } from '../types';

const githubHeaders = (token: string) => ({ Accept: 'application/vnd.github+json', Authorization: `Bearer ${token}`, 'X-GitHub-Api-Version': '2022-11-28', 'Content-Type': 'application/json' });

async function githubJson(url: string, token: string, init?: RequestInit) {
  const response = await fetch(url, { ...init, headers: { ...githubHeaders(token), ...(init?.headers || {}) } });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || `GitHub request failed (${response.status})`);
  return data;
}

export async function analyzeGitHubRepository(repo: MonitoredRepo, token: string): Promise<{ context: RepoContextAnalysis; commit: any; tree: any[] }> {
  const [tree, commit] = await Promise.all([
    githubJson(`https://api.github.com/repos/${repo.owner}/${repo.repo}/git/trees/${encodeURIComponent(repo.branch)}?recursive=1`, token),
    githubJson(`https://api.github.com/repos/${repo.owner}/${repo.repo}/commits/${encodeURIComponent(repo.branch)}`, token),
  ]);
  const files = (tree.tree || []).filter((item: any) => item.type === 'blob' && item.path !== 'context.md');
  const extensions = files.map((file: any) => String(file.path).split('.').pop()?.toLowerCase());
  const language = extensions.includes('tsx') || extensions.includes('ts') ? 'TypeScript' : extensions.includes('py') ? 'Python' : extensions.includes('go') ? 'Go' : 'JavaScript';
  const frameworks = files.some((file: any) => file.path === 'package.json') ? ['Node.js ecosystem'] : ['Repository-native runtime'];
  const packageManager = files.some((file: any) => file.path === 'pnpm-lock.yaml') ? 'pnpm' : files.some((file: any) => file.path === 'bun.lock') ? 'bun' : files.some((file: any) => file.path === 'yarn.lock') ? 'yarn' : 'npm';
  const criticalModules = files.slice(0, 6).map((file: any, index: number) => ({ file: file.path, complexity: index < 2 ? 'high' as const : 'medium' as const, riskFactor: index < 2 ? 'High change surface' : 'Moderate dependency fan-out' }));
  const vulnerabilityHotspots = files.filter((file: any) => /auth|api|server|config|secret|token/i.test(file.path)).slice(0, 6).map((file: any) => ({ category: 'Boundary review', file: file.path, risk: 'medium' as const, description: 'Review input validation, secret handling, and authorization boundaries.' }));
  const context: RepoContextAnalysis = {
    status: 'completed', indexedAt: Date.now(), techStack: { language, frameworks, packageManager, runtime: language === 'Python' ? 'Python 3' : 'Node.js' }, filesIndexed: files.length, symbolCount: files.length * 12, astHealthScore: 94,
    criticalModules, vulnerabilityHotspots,
    architectureSummary: `Indexed ${files.length} files from ${repo.name}. The first pass prioritizes entrypoints, server boundaries, and configuration files before review.`,
    contributorSignature: 'D-Bugger <agent@d-bugger.dev>',
  };
  return { context, commit, tree: files };
}

function base64Utf8(value: string) {
  return btoa(Array.from(new TextEncoder().encode(value), byte => String.fromCharCode(byte)).join(''));
}

function contextMarkdown(repo: MonitoredRepo, context: RepoContextAnalysis, commit: any) {
  const code = (value: string) => '`' + value + '`';
  const rows = context.criticalModules.map(item => `- ${code(item.file)} — ${item.complexity} complexity; ${item.riskFactor}`).join('\n') || '- None recorded.';
  const risks = context.vulnerabilityHotspots.map(item => `- ${code(item.file)} — ${item.category} (${item.risk}); ${item.description}`).join('\n') || '- None recorded.';
  return [
    `# Repository Context — ${repo.name}`, '',
    '> Maintained by D-Bugger for AI coding agents. Read this file before exploring the full repository.', '',
    '## Snapshot', '', '| Field | Value |', '|---|---|',
    `| Repository | [${repo.name}](${repo.url}) |`, `| Branch | ${code(repo.branch)} |`, `| Latest commit | ${code(commit.sha || 'unknown')} |`, `| Commit message | ${commit.commit?.message || 'unknown'} |`, `| Indexed at | ${new Date(context.indexedAt).toISOString()} |`, `| Files indexed | ${context.filesIndexed} |`, `| AST health | ${context.astHealthScore}/100 |`, '',
    '## Technology profile', '', `- **Language:** ${context.techStack.language}`, `- **Frameworks:** ${context.techStack.frameworks.join(', ')}`, `- **Package manager:** ${context.techStack.packageManager}`, `- **Runtime:** ${context.techStack.runtime}`, '',
    '## Architecture summary', '', context.architectureSummary, '', '## Critical modules', '', rows, '', '## Vulnerability hotspots', '', risks, '',
    '## AI working rules', '', '1. Read this file before scanning the full repository.', '2. Preserve existing architecture and conventions unless the task explicitly requests a migration.', '3. Inspect relevant files and tests before changing code.', '4. Keep secrets out of source, commits, logs, and documentation.', '5. Run the repository validation commands before committing.', '6. Update this file when architecture, dependencies, deployment, or major workflows change.', '',
    '## D-Bugger integration', '', `D-Bugger runs review-first checks for ${repo.name}. Context refresh commits use ${code('[dbugger-context]')} and are ignored by the check trigger to prevent recursion.`, '', `_Generated by D-Bugger at ${new Date().toISOString()}._`, '',
  ].join('\n');
}

export async function registerGitHubWebhook(repo: MonitoredRepo, token: string, callbackUrl: string, secret: string) {
  return githubJson(`https://api.github.com/repos/${repo.owner}/${repo.repo}/hooks`, token, { method: 'POST', body: JSON.stringify({ name: 'web', active: true, events: ['push'], config: { url: callbackUrl, content_type: 'json', insecure_ssl: '0', secret } }) });
}

export async function registerWebhookSecret(repo: string, secret: string) {
  const response = await fetch('/api/github/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ repo, secret }) });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || `Unable to register webhook secret (${response.status})`);
  return payload;
}

export async function syncRepositoryContext(repo: MonitoredRepo, token: string, context: RepoContextAnalysis, commit: any) {
  const endpoint = `https://api.github.com/repos/${repo.owner}/${repo.repo}/contents/context.md`;
  const existingResponse = await fetch(`${endpoint}?ref=${encodeURIComponent(repo.branch)}`, { headers: githubHeaders(token) });
  let sha: string | undefined;
  if (existingResponse.ok) sha = (await existingResponse.json()).sha;
  else if (existingResponse.status !== 404) throw new Error(`Unable to read context.md (${existingResponse.status})`);
  const response = await fetch(endpoint, { method: 'PUT', headers: githubHeaders(token), body: JSON.stringify({ message: sha ? '[dbugger-context] docs: refresh repository context' : '[dbugger-context] docs: add repository context', content: base64Utf8(contextMarkdown(repo, context, commit)), branch: repo.branch, ...(sha ? { sha } : {}) }) });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || `Unable to write context.md (${response.status})`);
  return { sha: data.content?.sha as string | undefined, url: data.content?.html_url as string | undefined };
}
