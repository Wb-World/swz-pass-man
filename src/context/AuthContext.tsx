import React, { createContext, useContext, useEffect, useReducer, useCallback } from 'react';
import type { SessionInfo } from '@/types';
import {
  getSession,
  setSession,
  clearSession,
  isSessionExpired,
  updateActivity,
} from '@/utils/sessionUtils';

// ---- State ----

interface AuthContextState {
  session: SessionInfo | null;
  loading: boolean;
  pendingUser: SessionInfo | null; // user authenticated but 2FA not yet done
}

type AuthAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'LOGIN_SUCCESS'; payload: SessionInfo }
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
      setSession(verified);
      return { ...state, session: verified, pendingUser: null, loading: false };
    }
    case 'LOGIN_SUCCESS':
      return { ...state, session: action.payload, pendingUser: null, loading: false };
    case 'LOGOUT':
      clearSession();
      return { session: null, pendingUser: null, loading: false };
    case 'RESTORE_SESSION':
      return { ...state, session: action.payload, loading: false };
    default:
      return state;
  }
}

// ---- Context ----

interface AuthContextValue {
  session: SessionInfo | null;
  pendingUser: SessionInfo | null;
  loading: boolean;
  loginStep1: (userSession: SessionInfo) => void;
  loginStep2: () => void;
  logout: () => void;
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

  // Restore session on mount
  useEffect(() => {
    const stored = getSession();
    if (stored && stored.isAuthenticated && stored.is2FAVerified) {
      if (!isSessionExpired()) {
        dispatch({ type: 'RESTORE_SESSION', payload: stored });
      } else {
        clearSession();
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    } else {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  // Inactivity watcher
  useEffect(() => {
    if (!state.session) return;
    const interval = setInterval(() => {
      if (isSessionExpired()) {
        dispatch({ type: 'LOGOUT' });
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

  const logout = useCallback(() => {
    dispatch({ type: 'LOGOUT' });
  }, []);

  const updateLastActivity = useCallback(() => {
    updateActivity();
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

// ---- Hook ----

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
