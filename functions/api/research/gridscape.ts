interface GridscapeResearchEnv {
  GRIDSCAPE_RESEARCH_URL?: string;
}

interface GitHubContent {
  name?: string;
  path?: string;
  html_url?: string;
  content?: string;
  encoding?: string;
}

const repository = 'electric13k/Gridscape';
const githubHeaders = (token?: string) => ({
  Accept: 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28',
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
});

function decodeBase64(value: string) {
  const binary = atob(value.replace(/\n/g, ''));
  return new TextDecoder().decode(Uint8Array.from(binary, (character) => character.charCodeAt(0)));
}

async function readGitHubFile(path: string, token?: string) {
  const response = await fetch(`https://api.github.com/repos/${repository}/contents/${path}`, { headers: githubHeaders(token) });
  if (!response.ok) return null;
  const data = await response.json() as GitHubContent;
  if (data.encoding !== 'base64' || !data.content) return null;
  return { path, url: data.html_url || `https://github.com/${repository}/blob/main/${path}`, text: decodeBase64(data.content).slice(0, 12000) };
}

function offlineResearch(topic: string, sources: Array<{ path: string; url: string; text: string }>) {
  const context = sources.find((source) => source.path === 'context.md');
  const contract = sources.find((source) => source.path === 'functions/api/generate.ts');
  return {
    mode: 'repository-grounded-preview',
    text: `**${topic}** was researched against the Gridscape / Infinity Canvas repository.\n\nGridscape is a React + Vite spatial knowledge explorer. Its research contract is a POST request to /api/generate with a prompt and a JSON response containing explanatory text plus follow-up prompts. ${context ? 'The repository handoff confirms that Gemini synthesis stays server-side and an offline preview remains available.' : ''} ${contract ? 'The current generation route also documents the exact markdown-link format used for branching into connected concepts.' : ''}\n\nThis result is grounded in the repository snapshot. Configure GRIDSCAPE_RESEARCH_URL on D-Bugger if you want live delegation to a deployed Infinity Canvas instance.`,
    prompts: [`What are the core architecture boundaries in Gridscape for ${topic}?`, `How should D-Bugger use Gridscape’s branching research contract for ${topic}?`, `Which Gridscape files should an agent inspect next for ${topic}?`],
    sources: sources.map(({ path, url }) => ({ path, url })),
  };
}

export const onRequestPost: PagesFunction<GridscapeResearchEnv> = async ({ request, env }) => {
  try {
    const body = await request.json() as { topic?: unknown; githubToken?: unknown };
    const topic = typeof body.topic === 'string' ? body.topic.trim().slice(0, 1200) : '';
    const githubToken = typeof body.githubToken === 'string' && body.githubToken.length <= 300 ? body.githubToken.trim() : undefined;
    if (!topic) return Response.json({ error: 'Research topic is required.' }, { status: 400 });

    const paths = ['context.md', 'metadata.json', 'functions/api/generate.ts', 'src/App.tsx', 'src/utils/storage.ts'];
    const sources = (await Promise.all(paths.map((path) => readGitHubFile(path, githubToken)))).filter((source): source is { path: string; url: string; text: string } => Boolean(source));
    if (!sources.length) return Response.json({ error: githubToken ? 'Gridscape repository context could not be read with the supplied GitHub token.' : 'Add your GitHub token in API Credentials so the agent can read the Gridscape repository.' }, { status: githubToken ? 502 : 401 });

    if (env.GRIDSCAPE_RESEARCH_URL) {
      const endpoint = `${env.GRIDSCAPE_RESEARCH_URL.replace(/\/$/, '')}/api/generate`;
      const prompt = `Research this topic using the Infinity Canvas/Gridscape repository context below. Return concise findings and three follow-up prompts. Topic: ${topic}\n\nRepository sources:\n${sources.map((source) => `### ${source.path}\n${source.text}`).join('\n\n')}`;
      const delegated = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt }) });
      const payload = await delegated.json().catch(() => ({}));
      if (delegated.ok && typeof payload.text === 'string') return Response.json({ mode: 'infinity-canvas', text: payload.text, prompts: Array.isArray(payload.prompts) ? payload.prompts.slice(0, 3) : [], sources: sources.map(({ path, url }) => ({ path, url })) });
    }

    return Response.json(offlineResearch(topic, sources), { headers: { 'X-Gridscape-Research-Mode': 'repository-grounded-preview' } });
  } catch (error) {
    console.error('Gridscape research error:', error);
    return Response.json({ error: 'Unable to research through Gridscape right now.' }, { status: 500 });
  }
};
