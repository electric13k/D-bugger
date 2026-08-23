export interface WorkspaceUser {
  uid: string;
  email: string | null;
  displayName: string;
  photoURL: string | null;
}

const USER_KEY = 'dbugger_workspace_signed_in';
const ID_KEY = 'dbugger_workspace_id';
const EVENT_NAME = 'dbugger-auth-state';

function workspaceId() {
  const existing = window.localStorage.getItem(ID_KEY);
  if (existing) return existing;
  const created = `ws-${crypto.randomUUID()}`;
  window.localStorage.setItem(ID_KEY, created);
  return created;
}

function createUser(): WorkspaceUser {
  const id = workspaceId();
  return { uid: id, email: null, displayName: 'Workspace Operator', photoURL: null };
}

export function getWorkspaceUser(): WorkspaceUser | null {
  if (typeof window === 'undefined' || window.localStorage.getItem(USER_KEY) !== 'true') return null;
  return createUser();
}

export function onWorkspaceAuthStateChanged(callback: (user: WorkspaceUser | null) => void) {
  const notify = () => callback(getWorkspaceUser());
  notify();
  window.addEventListener(EVENT_NAME, notify);
  return () => window.removeEventListener(EVENT_NAME, notify);
}

export async function signInWithWorkspace(): Promise<WorkspaceUser> {
  window.localStorage.setItem(USER_KEY, 'true');
  const user = createUser();
  window.dispatchEvent(new Event(EVENT_NAME));
  return user;
}

export async function signOutWorkspace() {
  window.localStorage.removeItem(USER_KEY);
  window.dispatchEvent(new Event(EVENT_NAME));
}
