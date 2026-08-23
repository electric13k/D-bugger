export interface AuthEnv {
  DBUGGER_DB: D1Database;
}

export interface AuthUserRow {
  id: string;
  email: string;
  display_name: string | null;
  workspace_id: string;
}

const encoder = new TextEncoder();
const SESSION_COOKIE = 'dbugger_session';
const SESSION_MAX_AGE = 60 * 60 * 24 * 30;

export function normalizeEmail(value: unknown) {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

export function isValidEmail(email: string) {
  return email.length >= 3 && email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function json(data: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...(init.headers || {}) },
  });
}

export function workspaceIdFromRequest(request: Request) {
  const value = request.headers.get('X-Workspace-Id')?.trim();
  return value && value.length <= 120 ? value : `ws-${crypto.randomUUID()}`;
}

function base64Url(bytes: Uint8Array) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function fromBase64Url(value: string) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(value.length / 4) * 4, '=');
  const binary = atob(normalized);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

export async function randomSecret(size = 32) {
  const bytes = new Uint8Array(size);
  crypto.getRandomValues(bytes);
  return base64Url(bytes);
}

export async function sha256(value: string) {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(value));
  return base64Url(new Uint8Array(digest));
}

export async function hashPassword(password: string, salt?: string) {
  const saltBytes = salt ? fromBase64Url(salt) : (() => {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    return bytes;
  })();
  const key = await crypto.subtle.importKey('raw', encoder.encode(password), { name: 'PBKDF2' }, false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: saltBytes, iterations: 120000, hash: 'SHA-256' },
    key,
    256,
  );
  return { salt: base64Url(saltBytes), hash: base64Url(new Uint8Array(bits)) };
}

export function constantTimeEqual(left: string, right: string) {
  const a = encoder.encode(left);
  const b = encoder.encode(right);
  let difference = a.length ^ b.length;
  const length = Math.max(a.length, b.length);
  for (let index = 0; index < length; index += 1) difference |= (a[index] || 0) ^ (b[index] || 0);
  return difference === 0;
}

export function readSessionToken(request: Request) {
  const cookie = request.headers.get('Cookie') || '';
  const match = cookie.match(new RegExp(`(?:^|;\\s*)${SESSION_COOKIE}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : '';
}

export function sessionCookie(token: string, maxAge = SESSION_MAX_AGE) {
  return `${SESSION_COOKIE}=${encodeURIComponent(token)}; Max-Age=${maxAge}; Path=/; HttpOnly; Secure; SameSite=Lax`;
}

export async function createSession(env: AuthEnv, userId: string) {
  const token = await randomSecret(32);
  const tokenHash = await sha256(token);
  const now = Date.now();
  const expiresAt = now + SESSION_MAX_AGE * 1000;
  await env.DBUGGER_DB.prepare(
    'INSERT INTO auth_sessions (token_hash, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)',
  ).bind(tokenHash, userId, expiresAt, now).run();
  return { token, expiresAt };
}

export async function getSessionUser(request: Request, env: AuthEnv) {
  const token = readSessionToken(request);
  if (!token) return null;
  const tokenHash = await sha256(token);
  const now = Date.now();
  const row = await env.DBUGGER_DB.prepare(
    `SELECT u.id, u.email, u.display_name, u.workspace_id
     FROM auth_sessions s JOIN auth_users u ON u.id = s.user_id
     WHERE s.token_hash = ? AND s.expires_at > ? LIMIT 1`,
  ).bind(tokenHash, now).first<AuthUserRow>();
  if (!row) {
    await env.DBUGGER_DB.prepare('DELETE FROM auth_sessions WHERE token_hash = ?').bind(tokenHash).run();
    return null;
  }
  return row;
}

export async function deleteSession(request: Request, env: AuthEnv) {
  const token = readSessionToken(request);
  if (!token) return;
  await env.DBUGGER_DB.prepare('DELETE FROM auth_sessions WHERE token_hash = ?').bind(await sha256(token)).run();
}

export function userPayload(user: AuthUserRow) {
  return {
    uid: user.id,
    email: user.email,
    displayName: user.display_name || user.email.split('@')[0],
    photoURL: null,
    workspaceId: user.workspace_id,
  };
}
