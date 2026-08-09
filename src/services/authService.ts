import { supabase } from '@/lib/supabase';
import type { SessionInfo } from '@/types';
import type { Profile } from '@/types/database.types';

const TWO_FA_BIRTHDAY = '19/02/1889';

/**
 * Validate the login_user record first, then create the Supabase Auth session
 * required by the app's authenticated database policies.
 */
export async function signInWithEmail(
  email: string,
  password: string
): Promise<{ session: SessionInfo | null; error: string | null }> {
  const normalizedEmail = email.trim().toLowerCase();
  const { data: loginIsValid, error: loginCheckError } = await supabase.rpc(
    'authenticate_login_user',
    { p_email: normalizedEmail, p_password: password }
  );

  if (loginCheckError) {
    console.error('[Auth] login_user validation failed:', loginCheckError);
    return {
      session: null,
      error: 'Unable to reach the login database. Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY, then restart the local server.',
    };
  }

  if (!loginIsValid) {
    return { session: null, error: 'Invalid credentials' };
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: normalizedEmail,
    password,
  });

  if (error || !data.user) {
    return { session: null, error: error?.message ?? 'Invalid credentials' };
  }

  // Fetch profile from database
  const { data: profileData } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', data.user.id)
    .single();

  const profile = profileData as Profile | null;

  const sessionInfo: SessionInfo = {
    userId: data.user.id,
    isAuthenticated: true,
    is2FAVerified: false,
    username: profile?.username ?? email.split('@')[0],
    displayName: profile?.display_name ?? email.split('@')[0],
    role: (profile?.role as SessionInfo['role']) ?? 'viewer',
    loginTime: new Date().toISOString(),
    avatar: profile?.avatar ?? email[0].toUpperCase(),
    email: data.user.email ?? email,
  };

  return { session: sessionInfo, error: null };
}

/**
 * Validate 2FA birthday answer (kept as second auth factor)
 */
export function validate2FA(birthday: string): boolean {
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
