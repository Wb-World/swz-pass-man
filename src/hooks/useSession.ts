import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { formatDuration } from '@/utils/sessionUtils';

/**
 * Hook for tracking and displaying session information
 */
export function useSession() {
  const { session, logout } = useAuth();
  const [duration, setDuration] = useState('0m');

  useEffect(() => {
    if (!session) return;
    const tick = () => {
      if (session.loginTime) {
        setDuration(formatDuration(session.loginTime));
      }
    };
    tick();
    const interval = setInterval(tick, 30000);
    return () => clearInterval(interval);
  }, [session]);

  const handleLogout = useCallback(() => {
    logout();
  }, [logout]);

  return {
    session,
    duration,
    logout: handleLogout,
    isAuthenticated: !!session?.isAuthenticated,
    is2FAVerified: !!session?.is2FAVerified,
  };
}
