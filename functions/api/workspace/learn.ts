interface Env { DBUGGER_DB: any }

export async function onRequestPost(context: { request: Request; env: Env }) {
  const workspaceId = context.request.headers.get('X-Workspace-Id')?.trim().slice(0, 80) || '';
  if (!workspaceId) return new Response(JSON.stringify({ error: 'X-Workspace-Id is required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  const body = await context.request.json() as { type?: string; metadata?: Record<string, unknown> };
  if (!body.type) return new Response(JSON.stringify({ error: 'type is required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  await context.env.DBUGGER_DB?.prepare('INSERT INTO working_style_events (workspace_id, event_type, metadata, created_at) VALUES (?1, ?2, ?3, datetime(\'now\'))').bind(workspaceId, body.type.slice(0, 120), JSON.stringify(body.metadata || {})).run();
  return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } });
}
