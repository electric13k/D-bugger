interface Env { DBUGGER_DB: any }

async function verifySignature(secret: string, body: string, signature: string | null) {
  if (!secret || !signature?.startsWith('sha256=')) return false;
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
  const expected = signature.slice('sha256='.length);
  const bytes = expected.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || [];
  return crypto.subtle.verify('HMAC', key, new Uint8Array(bytes), new TextEncoder().encode(body));
}

export async function onRequestPost(context: { request: Request; env: Env }) {
  const body = await context.request.text();
  const payload = JSON.parse(body || '{}');
  if (payload.ref && !payload.ref.startsWith('refs/heads/')) return new Response(JSON.stringify({ ok: true, ignored: true }), { headers: { 'Content-Type': 'application/json' } });
  const repo = payload.repository?.full_name || 'unknown/unknown';
  const secret = await context.env.DBUGGER_DB?.prepare('SELECT secret FROM webhook_secrets WHERE repo_name = ?1 LIMIT 1').bind(repo).first();
  const valid = secret?.secret ? await verifySignature(secret.secret, body, context.request.headers.get('X-Hub-Signature-256')) : false;
  if (!valid) return new Response(JSON.stringify({ error: 'Invalid webhook signature' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  const head = payload.head_commit || payload.commits?.[0] || {};
  await context.env.DBUGGER_DB?.prepare('INSERT INTO webhook_events (id, repo_name, commit_sha, commit_message, payload, created_at) VALUES (?1, ?2, ?3, ?4, ?5, datetime(\'now\'))').bind(`${repo}:${head.id || Date.now()}`, repo, head.id || '', head.message || 'Push received', body).run();
  return new Response(JSON.stringify({ ok: true, repo, commitSha: head.id || null }), { headers: { 'Content-Type': 'application/json' } });
}
