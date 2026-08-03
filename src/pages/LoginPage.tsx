import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Lock, User, Shield, AlertCircle, Loader2, ChevronRight } from 'lucide-react';
import { validateCredentials } from '@/services/authService';
import { useAuth } from '@/context/AuthContext';
import type { SessionInfo } from '@/types';

const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 30; // seconds

// Animated background particles
function Particle({ delay, x, y, size }: { delay: number; x: number; y: number; size: number }) {
  return (
    <motion.div
      className="absolute rounded-full bg-brand-500/20"
      style={{ left: `${x}%`, top: `${y}%`, width: size, height: size }}
      animate={{
        y: [-20, 20, -20],
        x: [-10, 10, -10],
        opacity: [0.1, 0.4, 0.1],
        scale: [0.8, 1.2, 0.8],
      }}
      transition={{ duration: 6 + delay, repeat: Infinity, delay, ease: 'easeInOut' }}
    />
  );
}

const PARTICLES = Array.from({ length: 20 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: Math.random() * 60 + 10,
  delay: Math.random() * 4,
}));

export function LoginPage() {
  const navigate = useNavigate();
  const { loginStep1, session } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [locked, setLocked] = useState(false);
  const [lockTimer, setLockTimer] = useState(LOCKOUT_DURATION);
  const [shake, setShake] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Redirect if already authenticated
  useEffect(() => {
    if (session?.isAuthenticated && session?.is2FAVerified) {
      navigate('/dashboard', { replace: true });
    }
  }, [session, navigate]);

  // Lockout countdown
  useEffect(() => {
    if (locked) {
      setLockTimer(LOCKOUT_DURATION);
      timerRef.current = setInterval(() => {
        setLockTimer((t) => {
          if (t <= 1) {
            clearInterval(timerRef.current!);
            setLocked(false);
            setAttempts(0);
            setError('');
            return LOCKOUT_DURATION;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [locked]);

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (locked) return;
    if (!username.trim() || !password.trim()) {
      setError('Please enter your username and password.');
      triggerShake();
      return;
    }

    setLoading(true);
    setError('');

    // Simulate network delay
    await new Promise((r) => setTimeout(r, 900));

    const user = validateCredentials(username, password);

    if (user) {
      const sessionInfo: SessionInfo = {
        isAuthenticated: true,
        is2FAVerified: false,
        username: user.username,
        displayName: user.displayName,
        role: user.role,
        loginTime: new Date().toISOString(),
        avatar: user.avatar,
        email: user.email,
      };
      loginStep1(sessionInfo);
      navigate('/2fa', { replace: true });
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      if (newAttempts >= MAX_ATTEMPTS) {
        setLocked(true);
        setError(`Too many failed attempts. Locked for ${LOCKOUT_DURATION} seconds.`);
      } else {
        setError(`Invalid credentials. ${MAX_ATTEMPTS - newAttempts} attempt${MAX_ATTEMPTS - newAttempts !== 1 ? 's' : ''} remaining.`);
      }
      triggerShake();
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-dark-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0">
        {/* Gradient blobs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-600/15 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }} />
        <div className="absolute top-3/4 left-1/3 w-64 h-64 bg-cyan-600/8 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '4s' }} />

        {/* Particles */}
        {PARTICLES.map((p) => (
          <Particle key={p.id} x={p.x} y={p.y} size={p.size} delay={p.delay} />
        ))}

        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `linear-gradient(rgba(79,99,240,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(79,99,240,0.3) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      {/* Login Card */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative w-full max-w-md z-10"
      >
        <motion.div
          animate={shake ? { x: [-8, 8, -8, 8, 0] } : {}}
          transition={{ duration: 0.4 }}
          className="bg-dark-900/70 backdrop-blur-2xl rounded-3xl border border-white/10 shadow-2xl shadow-black/50 overflow-hidden"
        >
          {/* Top accent line */}
          <div className="h-px bg-gradient-to-r from-transparent via-brand-500 to-transparent" />

          <div className="px-8 py-8">
            {/* Logo */}
            <div className="flex flex-col items-center mb-8">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="w-20 h-20 rounded-2xl overflow-hidden ring-2 ring-brand-500/30 shadow-lg shadow-brand-500/20 mb-4"
              >
                <img
                  src="/brand_logo.jpg"
                  alt="Secure Worldz"
                  className="w-full h-full object-cover"
                />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-center"
              >
                <h1 className="text-white font-bold text-2xl tracking-tight">Secure Worldz</h1>
                <p className="text-dark-400 text-sm mt-1">Password Manager — Enterprise Edition</p>
              </motion.div>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3 mb-6">
              <div className="flex-1 h-px bg-white/5" />
              <div className="flex items-center gap-1.5 text-dark-500 text-xs">
                <Lock className="w-3 h-3" />
                <span>Secure Login</span>
              </div>
              <div className="flex-1 h-px bg-white/5" />
            </div>

            {/* Lockout Banner */}
            <AnimatePresence>
              {locked && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3"
                >
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                  <div>
                    <p className="text-red-300 text-sm font-medium">Account Locked</p>
                    <p className="text-red-400/70 text-xs">Retry in {lockTimer}s</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error */}
            <AnimatePresence>
              {error && !locked && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-2"
                >
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                  <p className="text-red-300 text-sm">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Username */}
              <div>
                <label className="block text-dark-300 text-sm font-medium mb-2">Username</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={locked}
                    autoComplete="username"
                    placeholder="Enter your username"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-dark-800/80 border border-white/10 text-white placeholder-dark-500 text-sm focus:outline-none focus:border-brand-500/60 focus:ring-1 focus:ring-brand-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-dark-300 text-sm font-medium mb-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={locked}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    className="w-full pl-10 pr-11 py-3 rounded-xl bg-dark-800/80 border border-white/10 text-white placeholder-dark-500 text-sm focus:outline-none focus:border-brand-500/60 focus:ring-1 focus:ring-brand-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-dark-400 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember me & Forgot password */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-white/20 bg-dark-800 text-brand-500 focus:ring-brand-500/30 focus:ring-1"
                  />
                  <span className="text-dark-300 text-sm">Remember me</span>
                </label>
                <button
                  type="button"
                  disabled
                  title="Contact your administrator"
                  className="text-dark-500 text-sm cursor-not-allowed opacity-50 hover:text-dark-400 transition-colors"
                >
                  Forgot password?
                </button>
              </div>

              {/* Submit */}
              <motion.button
                type="submit"
                disabled={loading || locked}
                whileTap={{ scale: 0.98 }}
                className="w-full py-3 px-4 rounded-xl bg-brand-500 hover:bg-brand-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-brand-500/25 transition-all duration-200 mt-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Authenticating...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </motion.button>
            </form>

            {/* Security Footer */}
            <div className="mt-6 flex items-center justify-center gap-2 text-dark-500 text-xs">
              <Shield className="w-3 h-3" />
              <span>Protected by 2-Factor Authentication</span>
            </div>
          </div>

          {/* Bottom accent */}
          <div className="h-px bg-gradient-to-r from-transparent via-brand-500/50 to-transparent" />
          <div className="px-8 py-3 bg-dark-900/50 flex items-center justify-center gap-1.5">
            <span className="text-dark-500 text-xs">© 2026 Secure Worldz — v1.0.0</span>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
