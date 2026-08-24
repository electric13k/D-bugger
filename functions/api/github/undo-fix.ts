interface UndoFixEnv {}

interface UndoFixBody {
  owner?: unknown;
  repo?: unknown;
  branch?: unknown;
  pullRequestNumber?: unknown;
  token?: unknown;
}

function text(value: unknown, max: number) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function githubHeaders(token: string) {
  return {
    Accept: 'application/vnd.github+json',
    Authorization: `Bearer ${token}`,
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'D-Bugger-Real-Undo',
    'Content-Type': 'application/json',
  };
}

async function githubRequest(url: string, token: string, init?: RequestInit) {
  const response = await fetch(url, { ...init, headers: { ...githubHeaders(token), ...(init?.headers || {}) } });
  const data = await response.json().catch(() => ({})) as any;
  if (!response.ok) throw new Error(data.message || `GitHub request failed (${response.status})`);
  return data;
}

export const onRequestPost: PagesFunction<UndoFixEnv> = async ({ request }) => {
  try {
    const body = await request.json() as UndoFixBody;
    const owner = text(body.owner, 100);
    const repo = text(body.repo, 100);
    const branch = text(body.branch, 200);
    const token = text(body.token, 300);
    const pullRequestNumber = typeof body.pullRequestNumber === 'number' ? body.pullRequestNumber : 0;
    if (!token) return Response.json({ error: 'A GitHub token is required for a real undo.' }, { status: 401 });
    if (!/^[A-Za-z0-9_.-]+$/.test(owner) || !/^[A-Za-z0-9_.-]+$/.test(repo) || !/^dbugger\/fix-[A-Za-z0-9]+$/.test(branch)) return Response.json({ error: 'A verified D-Bugger branch is required for undo.' }, { status: 400 });
    if (pullRequestNumber > 0) {
      await githubRequest(`https://api.github.com/repos/${owner}/${repo}/pulls/${pullRequestNumber}`, token, { method: 'PATCH', body: JSON.stringify({ state: 'closed' }) });
    }
    await githubRequest(`https://api.github.com/repos/${owner}/${repo}/git/refs/heads/${encodeURIComponent(branch)}`, token, { method: 'DELETE' });
    return Response.json({ undone: true, branch, pullRequestNumber: pullRequestNumber || undefined });
  } catch (error: any) {
    console.error('Real GitHub undo failed:', error);
    return Response.json({ undone: false, error: error?.message || 'GitHub undo failed.' }, { status: 502 });
  }
};
