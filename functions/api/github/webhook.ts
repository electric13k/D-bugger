interface Env { DBUGGER_DB: D1Database }

async function hmacHex(secret: string, payload: string) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  return Array.from(new Uint8Array(signature), byte => byte.toString(16).padStart(2, '0')).join('');
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const payload = await request.text();
  const body = JSON.parse(payload || '{}');
  const repo = body.repository?.full_name;
  const event = request.headers.get('X-GitHub-Event') || 'unknown';
  if (!repo) return Response.json({ error: 'repository.full_name is required' }, { status: 400 });
  const secretRow = await env.DBUGGER_DB.prepare('SELECT secret FROM webhook_secrets WHERE repo = ? LIMIT 1').bind(repo).first<{ secret: string }>();
  if (!secretRow) return Response.json({ error: 'webhook is not registered' }, { status: 404 });
  const signature = request.headers.get('X-Hub-Signature-256') || '';
  const expected = `sha256=${await hmacHex(secretRow.secret, payload)}`;
  const signatureBytes = new TextEncoder().encode(signature);
  const expectedBytes = new TextEncoder().encode(expected);
  let mismatch = signatureBytes.length === expectedBytes.length ? 0 : 1;
  for (let index = 0; index < Math.max(signatureBytes.length, expectedBytes.length); index += 1) mismatch |= (signatureBytes[index] || 0) ^ (expectedBytes[index] || 0);
  if (mismatch !== 0) return Response.json({ error: 'invalid signature' }, { status: 401 });
  const commit = body.head_commit || body.commits?.[0] || {};
  await env.DBUGGER_DB.prepare('INSERT INTO webhook_events (repo, event_type, commit_sha, commit_message, payload_json, created_at) VALUES (?, ?, ?, ?, ?, ?)').bind(repo, event, commit.id || body.after || null, commit.message || null, payload, Date.now()).run();
  return Response.json({ ok: true });
};
