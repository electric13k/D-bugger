interface Env { DBUGGER_DB: any }

export async function onRequestPost(context: { request: Request; env: Env }) {
  const body = await context.request.json() as { repo?: string; secret?: string };
  if (!body.repo || !body.secret) return new Response(JSON.stringify({ error: 'repo and secret are required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  await context.env.DBUGGER_DB?.prepare('INSERT INTO webhook_secrets (repo_name, secret, updated_at) VALUES (?1, ?2, datetime(\'now\')) ON CONFLICT(repo_name) DO UPDATE SET secret = excluded.secret, updated_at = excluded.updated_at').bind(body.repo, body.secret).run();
  return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } });
}
