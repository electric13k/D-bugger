import {
  AuthEnv,
  createSession,
  hashPassword,
  isValidEmail,
  json,
  normalizeEmail,
  sessionCookie,
  userPayload,
} from './_shared';

interface LoginBody {
  email?: unknown;
  password?: unknown;
}

export const onRequestPost: PagesFunction<AuthEnv> = async ({ request, env }) => {
  let body: LoginBody;
  try {
    body = await request.json<LoginBody>();
  } catch {
    return json({ error: 'Enter your email and password.' }, { status: 400 });
  }

  const email = normalizeEmail(body.email);
  const password = typeof body.password === 'string' ? body.password : '';
  if (!isValidEmail(email) || password.length === 0) return json({ error: 'Enter your email and password.' }, { status: 400 });

  const row = await env.DBUGGER_DB.prepare(
    `SELECT id, email, display_name, password_hash, password_salt, workspace_id
     FROM auth_users WHERE email = ? LIMIT 1`,
  ).bind(email).first<{ id: string; email: string; display_name: string | null; password_hash: string; password_salt: string; workspace_id: string }>();

  if (!row) return json({ error: 'Email or password is incorrect.' }, { status: 401 });
  const passwordData = await hashPassword(password, row.password_salt);
  if (passwordData.hash !== row.password_hash) return json({ error: 'Email or password is incorrect.' }, { status: 401 });

  const session = await createSession(env, row.id);
  return json({ user: userPayload(row) }, { headers: { 'Set-Cookie': sessionCookie(session.token) } });
};
