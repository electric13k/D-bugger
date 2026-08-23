export const isCloudflareConfigured = true;

const WORKSPACE_KEY = 'dbugger.workspace.id';

function createWorkspaceId() {
  const random = crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `ws_${random.replaceAll('-', '').slice(0, 24)}`;
}

export function getWorkspaceId() {
  const existing = localStorage.getItem(WORKSPACE_KEY);
  if (existing) return existing;
  const next = createWorkspaceId();
  localStorage.setItem(WORKSPACE_KEY, next);
  return next;
}

export function clearWorkspace() {
  localStorage.removeItem(WORKSPACE_KEY);
}

export function workspaceLabel() {
  return `Workspace ${getWorkspaceId().slice(-6)}`;
}
