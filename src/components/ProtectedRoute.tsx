import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

// ---- Loading Spinner ----

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-dark-950 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-2xl overflow-hidden">
          <img src="/brand_logo.jpg" alt="SWZ" className="w-full h-full object-cover animate-pulse" />
        </div>
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-brand-500 animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ---- Protected Route ----
// Requires Supabase auth + 2FA verification

interface ProtectedRouteProps {
  children: React.ReactNode;
  require2FA?: boolean;
}

export function ProtectedRoute({ children, require2FA = true }: ProtectedRouteProps) {
  const { session, pendingUser, loading } = useAuth();

  if (loading) return <LoadingScreen />;

  // Not logged in at all
  if (!session && !pendingUser) {
    return <Navigate to="/login" replace />;
  }

  // Logged in (Supabase) but 2FA not yet done
  if (require2FA && !session?.is2FAVerified) {
    return <Navigate to="/2fa" replace />;
  }

  return <>{children}</>;
}

// ---- Admin Route ----
// Requires Supabase auth + 2FA + admin/root role

export function AdminRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();

  if (loading) return <LoadingScreen />;

  if (!session?.is2FAVerified) {
    return <Navigate to="/login" replace />;
  }

  if (session.role !== 'admin' && session.role !== 'root') {
    // Non-admin users are redirected to dashboard with no indication
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
