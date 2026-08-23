interface Env { DBUGGER_DB: D1Database }

function workspaceId(request: Request) {
  return request.headers.get('X-Workspace-Id') || 'anonymous';
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const row = await env.DBUGGER_DB.prepare('SELECT state_json, updated_at FROM workspace_states WHERE workspace_id = ? LIMIT 1').bind(workspaceId(request)).first<{ state_json: string; updated_at: number }>();
  return Response.json({ state: row ? JSON.parse(row.state_json) : null, updatedAt: row?.updated_at || null });
};

export const onRequestPut: PagesFunction<Env> = async ({ request, env }) => {
  const body = await request.json<{ state?: unknown }>();
  if (!body.state) return Response.json({ error: 'state is required' }, { status: 400 });
  const now = Date.now();
  await env.DBUGGER_DB.prepare('INSERT INTO workspace_states (workspace_id, state_json, updated_at) VALUES (?, ?, ?) ON CONFLICT(workspace_id) DO UPDATE SET state_json = excluded.state_json, updated_at = excluded.updated_at').bind(workspaceId(request), JSON.stringify(body.state), now).run();
  return Response.json({ ok: true, updatedAt: now });
};
