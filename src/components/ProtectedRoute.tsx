import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  require2FA?: boolean;
}

export function ProtectedRoute({ children, require2FA = true }: ProtectedRouteProps) {
  const { session, pendingUser, loading } = useAuth();

  if (loading) {
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

  // Not logged in at all
  if (!session && !pendingUser) {
    return <Navigate to="/login" replace />;
  }

  // Logged in but 2FA pending
  if (require2FA && session && !session.is2FAVerified) {
    return <Navigate to="/2fa" replace />;
  }

  // Waiting for 2FA verification
  if (require2FA && !session?.is2FAVerified) {
    return <Navigate to="/2fa" replace />;
  }

  return <>{children}</>;
}
