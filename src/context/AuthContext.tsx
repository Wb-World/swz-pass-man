import React, { createContext, useContext, useEffect, useReducer, useCallback } from 'react';
import type { SessionInfo } from '@/types';
import type { Profile } from '@/types/database.types';
import { supabase } from '@/lib/supabase';
import { isSessionExpired, formatDuration } from '@/utils/sessionUtils';

// ---- Constants ----

const TWO_FA_KEY = 'swz_2fa_verified'; // localStorage key: stores user UUID when 2FA is done

// ---- State ----

interface AuthContextState {
  session: SessionInfo | null;
  loading: boolean;
  pendingUser: SessionInfo | null; // authenticated via Supabase but 2FA not yet done
}

type AuthAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'PENDING_2FA'; payload: SessionInfo }
  | { type: 'VERIFY_2FA' }
  | { type: 'LOGOUT' }
  | { type: 'RESTORE_SESSION'; payload: SessionInfo };

function authReducer(state: AuthContextState, action: AuthAction): AuthContextState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };

    case 'PENDING_2FA':
      return { ...state, pendingUser: action.payload, loading: false };

    case 'VERIFY_2FA': {
      if (!state.pendingUser) return state;
      const verified: SessionInfo = { ...state.pendingUser, is2FAVerified: true };
      localStorage.setItem(TWO_FA_KEY, verified.userId);
      return { ...state, session: verified, pendingUser: null, loading: false };
    }

    case 'LOGOUT':
      localStorage.removeItem(TWO_FA_KEY);
      return { session: null, pendingUser: null, loading: false };

    case 'RESTORE_SESSION':
      return { ...state, session: action.payload, loading: false };

    default:
      return state;
  }
}

// ---- Context value ----

interface AuthContextValue {
  session: SessionInfo | null;
  pendingUser: SessionInfo | null;
  loading: boolean;
  loginStep1: (userSession: SessionInfo) => void;
  loginStep2: () => void;
  logout: () => Promise<void>;
  updateLastActivity: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ---- Provider ----

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, {
    session: null,
    pendingUser: null,
    loading: true,
  });

  // ---- Initialize auth on mount ----
  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        // First try to restore a Supabase Auth session
        const { data: { session: supabaseSession } } = await supabase.auth.getSession();

        if (!mounted) return;

        if (supabaseSession) {
          // Fetch profile from DB
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', supabaseSession.user.id)
            .single();

          const profile = profileData as Profile | null;

          if (!mounted) return;

          const sessionInfo: SessionInfo = {
            userId: supabaseSession.user.id,
            isAuthenticated: true,
            is2FAVerified: false,
            username: profile?.username ?? supabaseSession.user.email?.split('@')[0] ?? '',
            displayName: profile?.display_name ?? supabaseSession.user.email?.split('@')[0] ?? '',
            role: (profile?.role as SessionInfo['role']) ?? 'viewer',
            loginTime: supabaseSession.user.last_sign_in_at ?? new Date().toISOString(),
            avatar: profile?.avatar ?? '?',
            email: supabaseSession.user.email ?? '',
          };

          const twoFAUserId = localStorage.getItem(TWO_FA_KEY);
          const twoFAVerified = twoFAUserId === supabaseSession.user.id;

          if (twoFAVerified && !isSessionExpired()) {
            dispatch({ type: 'RESTORE_SESSION', payload: { ...sessionInfo, is2FAVerified: true } });
          } else if (twoFAVerified && isSessionExpired()) {
            localStorage.removeItem(TWO_FA_KEY);
            await supabase.auth.signOut();
            dispatch({ type: 'SET_LOADING', payload: false });
          } else {
            dispatch({ type: 'PENDING_2FA', payload: sessionInfo });
          }
          return;
        }

        // No Supabase Auth session — check for a fallback profile-only session in sessionStorage
        // This happens when login_user validation passes but Supabase Auth signIn fails
        const storedSession = sessionStorage.getItem('swz_fallback_session');
        if (storedSession) {
          try {
            const parsed: SessionInfo = JSON.parse(storedSession);
            const twoFAUserId = localStorage.getItem(TWO_FA_KEY);
            const twoFAVerified = twoFAUserId === parsed.userId;
            if (twoFAVerified && !isSessionExpired()) {
              dispatch({ type: 'RESTORE_SESSION', payload: { ...parsed, is2FAVerified: true } });
            } else {
              dispatch({ type: 'PENDING_2FA', payload: { ...parsed, is2FAVerified: false } });
            }
          } catch {
            sessionStorage.removeItem('swz_fallback_session');
            dispatch({ type: 'SET_LOADING', payload: false });
          }
          return;
        }

        dispatch({ type: 'SET_LOADING', payload: false });
      } catch (error) {
        console.error('[AuthContext] Initialization error:', error);
        if (mounted) dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event) => {
      if (!mounted) return;
      if (event === 'SIGNED_OUT') {
        sessionStorage.removeItem('swz_fallback_session');
        dispatch({ type: 'LOGOUT' });
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!state.session) return;
    const interval = setInterval(() => {
      if (isSessionExpired()) {
        supabase.auth.signOut().then(() => {
          dispatch({ type: 'LOGOUT' });
        });
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [state.session]);

  const loginStep1 = useCallback((userSession: SessionInfo) => {
    dispatch({ type: 'PENDING_2FA', payload: userSession });
  }, []);

  const loginStep2 = useCallback(() => {
    dispatch({ type: 'VERIFY_2FA' });
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    dispatch({ type: 'LOGOUT' });
  }, []);

  const updateLastActivity = useCallback(() => {
    localStorage.setItem('swz_activity', Date.now().toString());
  }, []);

  return (
    <AuthContext.Provider
      value={{
        session: state.session,
        pendingUser: state.pendingUser,
        loading: state.loading,
        loginStep1,
        loginStep2,
        logout,
        updateLastActivity,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

export { formatDuration };
