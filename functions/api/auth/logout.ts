import { AuthEnv, deleteSession, json, sessionCookie } from './_shared';

export const onRequestPost: PagesFunction<AuthEnv> = async ({ request, env }) => {
  await deleteSession(request, env);
  return json({ ok: true }, { headers: { 'Set-Cookie': sessionCookie('', 0) } });
};
