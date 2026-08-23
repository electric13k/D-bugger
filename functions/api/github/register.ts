interface Env { DBUGGER_DB: D1Database }

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const body = await request.json<{ repo?: string; secret?: string }>();
  if (!body.repo || !body.secret) return Response.json({ error: 'repo and secret are required' }, { status: 400 });
  await env.DBUGGER_DB.prepare('INSERT INTO webhook_secrets (repo, secret, updated_at) VALUES (?, ?, ?) ON CONFLICT(repo) DO UPDATE SET secret = excluded.secret, updated_at = excluded.updated_at').bind(body.repo, body.secret, Date.now()).run();
  return Response.json({ ok: true });
};
