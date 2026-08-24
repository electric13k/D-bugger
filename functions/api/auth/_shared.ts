export interface AuthEnv {
  DBUGGER_DB: D1Database;
  GOOGLE_FIREBASE_PROJECT_ID?: string;
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
const DEFAULT_FIREBASE_PROJECT_ID = 'igneous-shift-0xctm';
let googleCertificates: { expiresAt: number; values: Record<string, string> } | null = null;

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

function decodeJson(value: string) {
  return JSON.parse(new TextDecoder().decode(fromBase64Url(value)));
}

interface DerNode {
  tag: number;
  start: number;
  end: number;
  children?: DerNode[];
}

function readDerNode(bytes: Uint8Array, offset: number): DerNode {
  const tag = bytes[offset];
  let length = bytes[offset + 1];
  let cursor = offset + 2;
  if (length & 0x80) {
    const width = length & 0x7f;
    length = 0;
    for (let index = 0; index < width; index += 1) length = (length << 8) | bytes[cursor + index];
    cursor += width;
  }
  const end = cursor + length;
  const node: DerNode = { tag, start: offset, end };
  if (tag === 0x30) {
    const children: DerNode[] = [];
    while (cursor < end) {
      const child = readDerNode(bytes, cursor);
      children.push(child);
      cursor = child.end;
    }
    node.children = children;
  }
  return node;
}

function findSubjectPublicKeyInfo(node: DerNode): DerNode | null {
  if (node.tag === 0x30 && node.children?.[0]?.tag === 0x30 && node.children?.[1]?.tag === 0x03) return node;
  for (const child of node.children || []) {
    const match = findSubjectPublicKeyInfo(child);
    if (match) return match;
  }
  return null;
}

function pemToBytes(pem: string) {
  const base64 = pem.replace(/-----BEGIN CERTIFICATE-----|-----END CERTIFICATE-----|\s/g, '');
  const binary = atob(base64);
  const certificate = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  const root = readDerNode(certificate, 0);
  const spki = findSubjectPublicKeyInfo(root);
  if (!spki) throw new Error('Google certificate public key could not be parsed.');
  return certificate.slice(spki.start, spki.end);
}

async function googlePublicCertificates() {
  if (googleCertificates && googleCertificates.expiresAt > Date.now()) return googleCertificates.values;
  const response = await fetch('https://www.googleapis.com/oauth2/v3/certs');
  if (!response.ok) throw new Error('Google certificate service is unavailable.');
  const values = await response.json() as Record<string, string>;
  const cacheControl = response.headers.get('cache-control') || '';
  const maxAge = Number(cacheControl.match(/max-age=(\d+)/)?.[1] || 3600);
  googleCertificates = { values, expiresAt: Date.now() + Math.min(maxAge, 86400) * 1000 };
  return values;
}

export async function verifyGoogleIdToken(token: string, projectId = DEFAULT_FIREBASE_PROJECT_ID) {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Invalid Google identity token.');
  const [encodedHeader, encodedPayload, encodedSignature] = parts;
  const header = decodeJson(encodedHeader) as { alg?: string; kid?: string };
  const payload = decodeJson(encodedPayload) as { aud?: string; iss?: string; sub?: string; email?: string; email_verified?: boolean; name?: string; picture?: string; exp?: number };
  if (header.alg !== 'RS256' || !header.kid || payload.aud !== projectId || payload.iss !== `https://securetoken.google.com/${projectId}` || !payload.sub || !payload.email || payload.email_verified !== true || !payload.exp || payload.exp <= Math.floor(Date.now() / 1000)) {
    throw new Error('Google identity token claims are not valid for D-Bugger.');
  }
  const certificate = (await googlePublicCertificates())[header.kid];
  if (!certificate) throw new Error('Google identity token certificate is unavailable.');
  const key = await crypto.subtle.importKey('spki', pemToBytes(certificate), { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
  const valid = await crypto.subtle.verify({ name: 'RSASSA-PKCS1-v1_5' }, key, fromBase64Url(encodedSignature), encoder.encode(`${encodedHeader}.${encodedPayload}`));
  if (!valid) throw new Error('Google identity token signature is invalid.');
  return payload;
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
