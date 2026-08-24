import {
  AuthEnv,
  createSession,
  hashPassword,
  json,
  normalizeEmail,
  sessionCookie,
  userPayload,
  verifyGoogleIdToken,
  workspaceIdFromRequest,
} from './_shared';

interface GoogleBody {
  idToken?: unknown;
}

export const onRequestPost: PagesFunction<AuthEnv> = async ({ request, env }) => {
  let body: GoogleBody;
  try {
    body = await request.json<GoogleBody>();
  } catch {
    return json({ error: 'Google sign-in payload is invalid.' }, { status: 400 });
  }
  const idToken = typeof body.idToken === 'string' ? body.idToken : '';
  if (!idToken || idToken.length > 10000) return json({ error: 'Google sign-in payload is invalid.' }, { status: 400 });

  try {
    const claims = await verifyGoogleIdToken(idToken, env.GOOGLE_FIREBASE_PROJECT_ID || 'igneous-shift-0xctm');
    const email = normalizeEmail(claims.email);
    const existing = await env.DBUGGER_DB.prepare(
      'SELECT id, email, display_name, workspace_id, password_hash, password_salt FROM auth_users WHERE email = ? LIMIT 1',
    ).bind(email).first<{ id: string; email: string; display_name: string | null; workspace_id: string; password_hash: string; password_salt: string }>();

    let user;
    if (existing) {
      user = { id: existing.id, email: existing.email, display_name: existing.display_name || claims.name || null, workspace_id: existing.workspace_id };
      if (!existing.display_name && claims.name) {
        await env.DBUGGER_DB.prepare('UPDATE auth_users SET display_name = ?, updated_at = ? WHERE id = ?').bind(claims.name.slice(0, 80), Date.now(), existing.id).run();
        user.display_name = claims.name.slice(0, 80);
      }
    } else {
      const now = Date.now();
      const userId = `user-${crypto.randomUUID()}`;
      const workspaceId = workspaceIdFromRequest(request);
      const passwordData = await hashPassword(`${crypto.randomUUID()}-${crypto.randomUUID()}`);
      await env.DBUGGER_DB.prepare(
        `INSERT INTO auth_users (id, email, display_name, password_hash, password_salt, workspace_id, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      ).bind(userId, email, claims.name?.slice(0, 80) || null, passwordData.hash, passwordData.salt, workspaceId, now, now).run();
      user = { id: userId, email, display_name: claims.name?.slice(0, 80) || null, workspace_id: workspaceId };
    }

    const session = await createSession(env, user.id);
    return json({ user: userPayload(user) }, { headers: { 'Set-Cookie': sessionCookie(session.token) } });
  } catch (error: any) {
    return json({ error: error?.message || 'Google sign-in could not be verified.' }, { status: 401 });
  }
};
