import { AuthEnv, getSessionUser, json, userPayload } from './_shared';

export const onRequestGet: PagesFunction<AuthEnv> = async ({ request, env }) => {
  const user = await getSessionUser(request, env);
  return json({ user: user ? userPayload(user) : null });
};
