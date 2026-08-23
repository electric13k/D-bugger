interface Env { DBUGGER_DB: any }

export async function onRequestGet(context: { request: Request; env: Env }) {
  const url = new URL(context.request.url);
  const repo = url.searchParams.get('repo');
  const limit = Math.min(Number(url.searchParams.get('limit') || 25), 100);
  if (!repo) return new Response(JSON.stringify({ error: 'repo is required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  const result = await context.env.DBUGGER_DB?.prepare('SELECT id, repo_name, commit_sha, commit_message, payload, created_at FROM webhook_events WHERE repo_name = ?1 ORDER BY created_at DESC LIMIT ?2').bind(repo, limit).all();
  return new Response(JSON.stringify({ events: result?.results || [] }), { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
}
