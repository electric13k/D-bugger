interface Env { DBUGGER_DB: D1Database }

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const workspaceId = request.headers.get('X-Workspace-Id') || 'anonymous';
  const body = await request.json<{ type?: string; metadata?: unknown }>();
  if (!body.type) return Response.json({ error: 'type is required' }, { status: 400 });
  await env.DBUGGER_DB.prepare('INSERT INTO working_style_events (workspace_id, event_type, metadata_json, created_at) VALUES (?, ?, ?, ?)').bind(workspaceId, body.type, JSON.stringify(body.metadata || {}), Date.now()).run();
  return Response.json({ ok: true });
};
