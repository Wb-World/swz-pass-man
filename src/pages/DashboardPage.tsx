import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  KeyRound, AlertTriangle, ShieldCheck, Star, Clock, TrendingUp,
  Activity, Globe, Lock, Eye, Copy, ExternalLink,
} from 'lucide-react';
import { usePasswords } from '@/context/PasswordContext';
import { useAuth } from '@/context/AuthContext';
import { useSession } from '@/hooks/useSession';
import { StatCard } from '@/components/StatCard';
import { StrengthBadge } from '@/components/StrengthBadge';
import { getLoginHistory } from '@/services/authService';
import { format } from 'date-fns';

const loginHistory = getLoginHistory();

export function DashboardPage() {
  const { stats, passwords } = usePasswords();
  const { session } = useAuth();
  const { duration } = useSession();
  const navigate = useNavigate();

  const recentPasswords = [...passwords]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);

  const categoryEntries = Object.entries(stats.categories).sort((a, b) => b[1] - a[1]);

  const securityColor =
    stats.securityScore >= 80 ? 'text-emerald-400' :
    stats.securityScore >= 50 ? 'text-amber-400' : 'text-red-400';

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-brand-900/50 via-brand-800/30 to-purple-900/30 border border-brand-500/20 px-4 sm:px-6 py-4 sm:py-5"
      >
        <div className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `radial-gradient(ellipse at 80% 50%, rgba(79,99,240,0.4) 0%, transparent 70%)`,
          }}
        />
        <div className="relative flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-white font-bold text-lg sm:text-xl">
              Welcome back, {session?.displayName} 👋
            </h2>
            <p className="text-dark-300 text-xs sm:text-sm mt-1">
              Your vault is secure. Last login:{' '}
              {session?.loginTime
                ? format(new Date(session.loginTime), 'MMM dd, yyyy h:mm a')
                : '—'}
            </p>
          </div>
          <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
            <div className="text-center">
              <p className="text-dark-400 text-[10px] sm:text-xs">Session</p>
              <p className="text-white font-bold text-xs sm:text-sm">{duration}</p>
            </div>
            <div className="h-8 sm:h-10 w-px bg-white/10" />
            <div className="text-center">
              <p className="text-dark-400 text-[10px] sm:text-xs">Security Score</p>
              <p className={`font-bold text-sm sm:text-lg ${securityColor}`}>{stats.securityScore}%</p>
            </div>
            <div className="h-8 sm:h-10 w-px bg-white/10" />
            <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400 text-[11px] sm:text-xs font-semibold">2FA Active</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
        <StatCard icon={KeyRound} label="Total Passwords" value={stats.total} color="blue" delay={0} />
        <StatCard icon={AlertTriangle} label="Weak Passwords" value={stats.weak} color="red" subtitle="Needs attention" delay={0.05} />
        <StatCard icon={ShieldCheck} label="Strong Passwords" value={stats.strong} color="green" delay={0.1} />
        <StatCard icon={Star} label="Favorites" value={stats.favorites} color="amber" delay={0.15} />
        <StatCard icon={Clock} label="Added This Week" value={stats.recentlyAdded} color="purple" delay={0.2} />
        <StatCard icon={TrendingUp} label="Security Score" value={`${stats.securityScore}%`} color="cyan" delay={0.25} />
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Passwords */}
        <div className="lg:col-span-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-2xl bg-dark-900/60 border border-white/8 overflow-hidden"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-brand-400" />
                <h3 className="text-white font-semibold text-sm">Recently Updated</h3>
              </div>
              <span className="text-dark-400 text-xs">{recentPasswords.length} entries</span>
            </div>
            <div className="divide-y divide-white/5">
              {recentPasswords.map((pw, i) => (
                <motion.div
                  key={pw.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.35 + i * 0.05 }}
                  className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/3 transition-colors group"
                >
                  {/* Site icon */}
                  <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-dark-800 border border-white/8 flex items-center justify-center">
                    <Globe className="w-4 h-4 text-dark-400" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{pw.website}</p>
                    <p className="text-dark-400 text-xs truncate">{pw.email || pw.username || '—'}</p>
                  </div>

                  {/* Category */}
                  <span className="hidden sm:block text-dark-500 text-xs truncate max-w-[100px]">{pw.category}</span>

                  {/* Strength */}
                  <StrengthBadge strength={pw.strength} size="sm" />

                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-1.5 rounded-lg hover:bg-white/10 text-dark-400 hover:text-white transition-colors" title="Copy password">
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button className="p-1.5 rounded-lg hover:bg-white/10 text-dark-400 hover:text-white transition-colors" title="Reveal">
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    {pw.url && (
                      <a href={pw.url} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg hover:bg-white/10 text-dark-400 hover:text-white transition-colors">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

      </div>
    </div>
  );
}
