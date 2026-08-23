import {
  AuthEnv,
  createSession,
  hashPassword,
  isValidEmail,
  json,
  normalizeEmail,
  sessionCookie,
  userPayload,
  workspaceIdFromRequest,
} from './_shared';

interface RegisterBody {
  email?: unknown;
  password?: unknown;
  displayName?: unknown;
}

export const onRequestPost: PagesFunction<AuthEnv> = async ({ request, env }) => {
  let body: RegisterBody;
  try {
    body = await request.json<RegisterBody>();
  } catch {
    return json({ error: 'Enter an email address and password.' }, { status: 400 });
  }

  const email = normalizeEmail(body.email);
  const password = typeof body.password === 'string' ? body.password : '';
  const displayName = typeof body.displayName === 'string' ? body.displayName.trim().slice(0, 80) : '';
  if (!isValidEmail(email)) return json({ error: 'Enter a valid email address.' }, { status: 400 });
  if (password.length < 8 || password.length > 128) {
    return json({ error: 'Password must be between 8 and 128 characters.' }, { status: 400 });
  }

  const existing = await env.DBUGGER_DB.prepare('SELECT id FROM auth_users WHERE email = ? LIMIT 1').bind(email).first<{ id: string }>();
  if (existing) return json({ error: 'An account with that email already exists. Sign in instead.' }, { status: 409 });

  const now = Date.now();
  const userId = `user-${crypto.randomUUID()}`;
  const workspaceId = workspaceIdFromRequest(request);
  const passwordData = await hashPassword(password);
  await env.DBUGGER_DB.prepare(
    `INSERT INTO auth_users (id, email, display_name, password_hash, password_salt, workspace_id, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  ).bind(userId, email, displayName || null, passwordData.hash, passwordData.salt, workspaceId, now, now).run();

  const user = { id: userId, email, display_name: displayName || null, workspace_id: workspaceId };
  const session = await createSession(env, userId);
  return json({ user: userPayload(user) }, { headers: { 'Set-Cookie': sessionCookie(session.token) } });
};
