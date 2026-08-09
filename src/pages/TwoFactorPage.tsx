import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, AlertCircle, CheckCircle2, Loader2, ChevronRight, ArrowLeft, Calendar } from 'lucide-react';
import { validate2FA } from '@/services/authService';
import { useAuth } from '@/context/AuthContext';

const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 30;

export function TwoFactorPage() {
  const navigate = useNavigate();
  const { pendingUser, loginStep2, logout } = useAuth();
  const [birthday, setBirthday] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [locked, setLocked] = useState(false);
  const [lockTimer, setLockTimer] = useState(LOCKOUT_DURATION);
  const [success, setSuccess] = useState(false);
  const [shake, setShake] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Redirect if no pending user
  useEffect(() => {
    if (!pendingUser) {
      navigate('/login', { replace: true });
    }
  }, [pendingUser, navigate]);

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
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [locked]);

  // Auto-format birthday input
  const handleBirthdayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/[^0-9/]/g, '');
    // Auto-insert slashes
    if (val.length === 2 && !val.includes('/') && birthday.length < 2) {
      val = val + '/';
    } else if (val.length === 5 && val.split('/').length === 2) {
      val = val + '/';
    }
    if (val.length <= 10) setBirthday(val);
  };

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (locked || success) return;

    if (!birthday.trim()) {
      setError('Please enter the birthday.');
      triggerShake();
      return;
    }

    setLoading(true);
    setError('');

    await new Promise((r) => setTimeout(r, 700));

    if (validate2FA(birthday)) {
      setSuccess(true);
      loginStep2();
      setTimeout(() => {
        navigate('/sites', { replace: true });
      }, 1200);
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);

      if (newAttempts >= MAX_ATTEMPTS) {
        setLocked(true);
        setError(`Too many failed attempts. Locked for ${LOCKOUT_DURATION} seconds.`);
      } else {
        setError(`Incorrect birthday. ${MAX_ATTEMPTS - newAttempts} attempt${MAX_ATTEMPTS - newAttempts !== 1 ? 's' : ''} remaining.`);
      }
      triggerShake();
    }

    setLoading(false);
  };

  const handleBack = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-dark-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-1/3 right-1/4 w-64 h-64 bg-brand-600/10 rounded-full blur-3xl animate-pulse-slow" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(circle at 50% 50%, rgba(79,99,240,0.3) 0%, transparent 70%)`,
          }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        <motion.div
          animate={shake ? { x: [-8, 8, -8, 8, 0] } : {}}
          transition={{ duration: 0.4 }}
          className="bg-dark-900/70 backdrop-blur-2xl rounded-3xl border border-white/10 shadow-2xl shadow-black/50 overflow-hidden"
        >
          <div className="h-px bg-gradient-to-r from-transparent via-purple-500 to-transparent" />

          <div className="px-5 sm:px-8 py-6 sm:py-8">
            {/* Header */}
            <div className="flex items-center mb-6">
              <button
                onClick={handleBack}
                className="p-1.5 rounded-lg text-dark-400 hover:text-white hover:bg-white/10 transition-colors mr-3"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <h1 className="text-white font-bold text-xl">Second Authentication</h1>
                <p className="text-dark-400 text-sm mt-0.5">Required to access your vault</p>
              </div>
            </div>

            {/* 2FA Image */}
            <div className="flex flex-col items-center mb-6">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, type: 'spring' }}
                className="relative"
              >
                {/* Glow ring */}
                <div className="absolute inset-0 rounded-full bg-purple-500/20 blur-xl scale-110" />
                <div className="relative w-32 h-32 rounded-full overflow-hidden ring-4 ring-purple-500/30 shadow-2xl shadow-purple-500/20">
                  <img
                    src="/jbaba.jpg"
                    alt="Jangu Baba"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Fallback if image missing
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
                {/* Shield badge */}
                <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-purple-500 border-2 border-dark-900 flex items-center justify-center">
                  <Shield className="w-4 h-4 text-white" />
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="mt-4 text-center"
              >
                <p className="text-dark-300 text-sm">
                  Welcome, <span className="text-white font-semibold">{pendingUser?.displayName}</span>
                </p>
              </motion.div>
            </div>

            {/* Question */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="bg-dark-800/60 rounded-xl px-4 py-3 mb-5 border border-white/5"
            >
              <p className="text-dark-400 text-xs font-medium uppercase tracking-wider mb-1">Security Question</p>
              <p className="text-white text-sm font-medium">What is Jangu Baba's Birthday?</p>
              <p className="text-dark-500 text-xs mt-1 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Enter in DD/MM/YYYY format
              </p>
            </motion.div>

            {/* Lockout */}
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
                    <p className="text-red-300 text-sm font-medium">Access Blocked</p>
                    <p className="text-red-400/70 text-xs">Retry in {lockTimer}s</p>
                  </div>
                  <div className="ml-auto">
                    <div className="w-10 h-10 rounded-full border-2 border-red-500/30 flex items-center justify-center">
                      <span className="text-red-400 text-sm font-mono font-bold">{lockTimer}</span>
                    </div>
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

            {/* Success */}
            <AnimatePresence>
              {success && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mb-4 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <p className="text-emerald-300 text-sm">Authentication successful! Redirecting...</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Input */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <div className="relative">
                  <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
                  <input
                    ref={inputRef}
                    type="text"
                    value={birthday}
                    onChange={handleBirthdayChange}
                    disabled={locked || success}
                    placeholder="DD/MM/YYYY"
                    maxLength={10}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-dark-800/80 border border-white/10 text-white placeholder-dark-500 text-sm font-mono focus:outline-none focus:border-purple-500/60 focus:ring-1 focus:ring-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all tracking-widest"
                  />
                </div>
                {/* Attempt indicators */}
                {attempts > 0 && !locked && (
                  <div className="flex items-center gap-1 mt-2">
                    {Array.from({ length: MAX_ATTEMPTS }).map((_, i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-colors ${
                          i < attempts ? 'bg-red-500' : 'bg-white/10'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>

              <motion.button
                type="submit"
                disabled={loading || locked || success}
                whileTap={{ scale: 0.98 }}
                className="w-full py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-purple-500/25 transition-all duration-200"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : success ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Verified!</span>
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4" />
                    <span>Verify & Continue</span>
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </motion.button>
            </form>
          </div>

          <div className="h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />
          <div className="px-8 py-3 bg-dark-900/50 flex items-center justify-center gap-1.5">
            <Shield className="w-3 h-3 text-dark-500" />
            <span className="text-dark-500 text-xs">Secure Worldz Manager — 2FA Layer</span>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
