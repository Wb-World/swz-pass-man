import type { SessionInfo } from '@/types';

const SESSION_KEY = 'swz_session';
const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes

/**
 * Save session to localStorage
 */
export function setSession(session: SessionInfo): void {
  const data = { ...session, lastActivity: Date.now() };
  localStorage.setItem(SESSION_KEY, JSON.stringify(data));
}

/**
 * Load session from localStorage
 */
export function getSession(): SessionInfo | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    return data as SessionInfo;
  } catch {
    return null;
  }
}

/**
 * Get last activity timestamp
 */
export function getLastActivity(): number {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return 0;
    const data = JSON.parse(raw);
    return data.lastActivity ?? 0;
  } catch {
    return 0;
  }
}

/**
 * Update last activity (call on user interaction)
 */
export function updateActivity(): void {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return;
    const data = JSON.parse(raw);
    data.lastActivity = Date.now();
    localStorage.setItem(SESSION_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
}

/**
 * Check if session is expired due to inactivity
 */
export function isSessionExpired(): boolean {
  const lastActivity = getLastActivity();
  if (!lastActivity) return true;
  return Date.now() - lastActivity > INACTIVITY_TIMEOUT;
}

/**
 * Clear session from localStorage
 */
export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
}

/**
 * Format session duration
 */
export function formatDuration(loginTime: string): string {
  const start = new Date(loginTime).getTime();
  const diff = Date.now() - start;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  return `${minutes}m`;
}

export { INACTIVITY_TIMEOUT };
