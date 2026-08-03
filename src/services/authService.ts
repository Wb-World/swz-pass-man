import authData from '@/data/auth.json';
import type { AuthUser } from '@/types';

const users: AuthUser[] = authData.users as AuthUser[];

const TWO_FA_BIRTHDAY = '19/02/1889';

/**
 * Validate username + password against auth.json
 * Returns the matching user or null
 */
export function validateCredentials(username: string, password: string): AuthUser | null {
  const user = users.find(
    (u) => u.username.toLowerCase() === username.toLowerCase() && u.password === password
  );
  return user ?? null;
}

/**
 * Validate 2FA birthday answer
 */
export function validate2FA(birthday: string): boolean {
  // Normalize: remove spaces, ensure DD/MM/YYYY
  const normalized = birthday.trim().replace(/\s/g, '');
  return normalized === TWO_FA_BIRTHDAY;
}

/**
 * Get simulated login history
 */
export function getLoginHistory() {
  return [
    {
      id: '1',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      success: true,
      ipAddress: '192.168.1.101',
      device: 'Chrome / Windows 11',
      location: 'Chennai, India',
    },
    {
      id: '2',
      timestamp: new Date(Date.now() - 86400000).toISOString(),
      success: true,
      ipAddress: '192.168.1.101',
      device: 'Firefox / Windows 11',
      location: 'Chennai, India',
    },
    {
      id: '3',
      timestamp: new Date(Date.now() - 172800000).toISOString(),
      success: false,
      ipAddress: '10.0.0.55',
      device: 'Unknown',
      location: 'Mumbai, India',
    },
    {
      id: '4',
      timestamp: new Date(Date.now() - 259200000).toISOString(),
      success: true,
      ipAddress: '192.168.1.101',
      device: 'Chrome / Windows 11',
      location: 'Chennai, India',
    },
    {
      id: '5',
      timestamp: new Date(Date.now() - 345600000).toISOString(),
      success: true,
      ipAddress: '192.168.1.101',
      device: 'Edge / Windows 11',
      location: 'Chennai, India',
    },
  ];
}
