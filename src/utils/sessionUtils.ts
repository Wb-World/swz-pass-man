const ACTIVITY_KEY = 'swz_activity';
const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes

/**
 * Update last activity timestamp (call on user interaction)
 */
export function updateActivity(): void {
  localStorage.setItem(ACTIVITY_KEY, Date.now().toString());
}

/**
 * Get last activity timestamp
 */
export function getLastActivity(): number {
  const raw = localStorage.getItem(ACTIVITY_KEY);
  return raw ? parseInt(raw, 10) : 0;
}

/**
 * Check if session is expired due to inactivity
 */
export function isSessionExpired(): boolean {
  const lastActivity = getLastActivity();
  if (!lastActivity) return false; // first launch — not expired
  return Date.now() - lastActivity > INACTIVITY_TIMEOUT;
}

/**
 * Format session duration from a start ISO string
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
