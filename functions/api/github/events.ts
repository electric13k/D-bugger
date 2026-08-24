interface Env { DBUGGER_DB: D1Database }

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const params = new URL(request.url).searchParams;
  const repo = params.get('repo');
  const limit = Math.min(Number(params.get('limit') || 20), 100);
  if (!repo) return Response.json({ error: 'repo is required' }, { status: 400, headers: { 'Cache-Control': 'no-store', Vary: 'Cookie' } });
  const result = await env.DBUGGER_DB.prepare('SELECT id, repo, event_type, commit_sha, commit_message, created_at FROM webhook_events WHERE repo = ? ORDER BY created_at DESC LIMIT ?').bind(repo, limit).all();
  return Response.json({ events: result.results || [] }, { headers: { 'Cache-Control': 'no-store', Vary: 'Cookie' } });
};
