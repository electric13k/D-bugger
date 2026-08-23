import { getWorkspaceId, setWorkspaceId } from './cloudflareWorkspace';

export interface WorkspaceUser {
  uid: string;
  email: string | null;
  displayName: string;
  photoURL: string | null;
  workspaceId?: string;
}

const GUEST_KEY = 'dbugger_workspace_signed_in';
const EVENT_NAME = 'dbugger-auth-state';
let cachedUser: WorkspaceUser | null = null;
let refreshStarted = false;

function createGuestUser(): WorkspaceUser {
  return { uid: getWorkspaceId(), email: null, displayName: 'Workspace Operator', photoURL: null, workspaceId: getWorkspaceId() };
}

function setCurrentUser(user: WorkspaceUser | null) {
  cachedUser = user;
  if (user?.workspaceId) setWorkspaceId(user.workspaceId);
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(EVENT_NAME));
}

function userFromPayload(payload: any): WorkspaceUser | null {
  if (!payload?.uid || !payload?.email) return null;
  return {
    uid: String(payload.uid),
    email: String(payload.email),
    displayName: String(payload.displayName || payload.email),
    photoURL: payload.photoURL ? String(payload.photoURL) : null,
    workspaceId: payload.workspaceId ? String(payload.workspaceId) : undefined,
  };
}

async function authRequest(path: string, body?: Record<string, unknown>) {
  const response = await fetch(path, {
    method: body ? 'POST' : 'GET',
    headers: { 'Content-Type': 'application/json', 'X-Workspace-Id': getWorkspaceId() },
    credentials: 'include',
    body: body ? JSON.stringify(body) : undefined,
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || `Authentication failed (${response.status})`);
  return payload;
}

export function getWorkspaceUser(): WorkspaceUser | null {
  return cachedUser;
}

export function onWorkspaceAuthStateChanged(callback: (user: WorkspaceUser | null) => void) {
  const notify = () => callback(getWorkspaceUser());
  notify();
  const onEvent = () => notify();
  window.addEventListener(EVENT_NAME, onEvent);
  if (!refreshStarted) {
    refreshStarted = true;
    void refreshWorkspaceUser();
  }
  return () => window.removeEventListener(EVENT_NAME, onEvent);
}

export async function refreshWorkspaceUser() {
  try {
    const payload = await authRequest('/api/auth/session');
    const user = userFromPayload(payload.user);
    if (user) {
      if (typeof window !== 'undefined') window.localStorage.removeItem(GUEST_KEY);
      setCurrentUser(user);
    } else if (!cachedUser) {
      setCurrentUser(null);
    }
    return user;
  } catch {
    return cachedUser;
  }
}

export async function registerWithEmail(email: string, password: string, displayName?: string) {
  const payload = await authRequest('/api/auth/register', { email, password, displayName });
  const user = userFromPayload(payload.user);
  if (!user) throw new Error('The account was created but no session was returned.');
  if (typeof window !== 'undefined') window.localStorage.removeItem(GUEST_KEY);
  setCurrentUser(user);
  return user;
}

export async function signInWithEmail(email: string, password: string) {
  const payload = await authRequest('/api/auth/login', { email, password });
  const user = userFromPayload(payload.user);
  if (!user) throw new Error('Signed in, but no account profile was returned.');
  if (typeof window !== 'undefined') window.localStorage.removeItem(GUEST_KEY);
  setCurrentUser(user);
  return user;
}

export async function signInWithWorkspace(): Promise<WorkspaceUser> {
  if (typeof window !== 'undefined') window.localStorage.setItem(GUEST_KEY, 'true');
  const user = createGuestUser();
  setCurrentUser(user);
  return user;
}

export async function signOutWorkspace() {
  try {
    await authRequest('/api/auth/logout', {});
  } catch {
    // Clear the local UI state even if the network is unavailable.
  }
  if (typeof window !== 'undefined') window.localStorage.removeItem(GUEST_KEY);
  setCurrentUser(null);
}
