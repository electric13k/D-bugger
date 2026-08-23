interface Env { DBUGGER_DB: any }

function workspaceId(request: Request) {
  return request.headers.get('X-Workspace-Id')?.trim().slice(0, 80) || '';
}

export async function onRequestGet(context: { request: Request; env: Env }) {
  const id = workspaceId(context.request);
  if (!id) return new Response(JSON.stringify({ error: 'X-Workspace-Id is required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  const row = await context.env.DBUGGER_DB?.prepare('SELECT state_json, updated_at FROM workspace_states WHERE workspace_id = ?1 LIMIT 1').bind(id).first();
  return new Response(JSON.stringify({ state: row?.state_json ? JSON.parse(row.state_json) : null, updatedAt: row?.updated_at || null }), { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
}

export async function onRequestPut(context: { request: Request; env: Env }) {
  const id = workspaceId(context.request);
  if (!id) return new Response(JSON.stringify({ error: 'X-Workspace-Id is required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  const body = await context.request.json() as { state?: unknown };
  if (!body.state || typeof body.state !== 'object') return new Response(JSON.stringify({ error: 'state is required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  await context.env.DBUGGER_DB?.prepare('INSERT INTO workspace_states (workspace_id, state_json, updated_at) VALUES (?1, ?2, datetime(\'now\')) ON CONFLICT(workspace_id) DO UPDATE SET state_json = excluded.state_json, updated_at = excluded.updated_at').bind(id, JSON.stringify(body.state)).run();
  return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } });
}
