import { useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, Search, Menu, X, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { usePasswords } from '@/context/PasswordContext';
import toast from 'react-hot-toast';
import clsx from 'clsx';

interface TopbarProps {
  onMenuToggle?: () => void;
}

export function Topbar({ onMenuToggle }: TopbarProps) {
  const { session, logout } = useAuth();
  const { stats } = usePasswords();
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const notifications = [
    { id: 1, text: `${stats.weak} weak passwords detected`, type: 'warning', time: 'Now' },
    { id: 2, text: '2FA is active on your account', type: 'success', time: '1h ago' },
    { id: 3, text: 'Session will expire in 30 minutes', type: 'info', time: '5m ago' },
  ];

  return (
    <motion.header
      initial={{ y: -10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-0 z-30 flex items-center justify-between px-6 py-3.5 bg-dark-950/80 backdrop-blur-xl border-b border-white/5"
    >
      {/* Left */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuToggle}
          className="p-1.5 rounded-lg text-dark-400 hover:text-white hover:bg-white/5 transition-colors lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="hidden md:flex items-center gap-2">
          <img src="/brand_logo.jpg" alt="SWZ" className="w-7 h-7 rounded-lg object-cover" />
          <span className="text-white font-bold text-sm">SWZ Pass Manager</span>
        </div>
      </div>

      {/* Center — search */}
      <div className="flex-1 max-w-md mx-6 hidden md:block">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
          <input
            type="text"
            placeholder="Search passwords..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-dark-400 text-sm focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/30 transition-all"
            onChange={(e) => {
              const val = e.target.value;
              navigate(val ? `/passwords?search=${encodeURIComponent(val)}` : '/passwords');
            }}
            onFocus={(e) => {
              if (e.target.value) {
                navigate(`/passwords?search=${encodeURIComponent(e.target.value)}`);
              } else {
                navigate('/passwords');
              }
            }}
          />
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        {/* Mobile search toggle */}
        <button
          onClick={() => setSearchOpen(!searchOpen)}
          className="p-2 rounded-lg text-dark-400 hover:text-white hover:bg-white/5 transition-colors md:hidden"
        >
          {searchOpen ? <X className="w-4 h-4" /> : <Search className="w-4 h-4" />}
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className="relative p-2 rounded-lg text-dark-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <Bell className="w-4.5 h-4.5" />
            {stats.weak > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500" />
            )}
          </button>

          {notifOpen && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className="absolute right-0 top-full mt-2 w-72 rounded-xl bg-dark-900 border border-white/10 shadow-2xl overflow-hidden z-50"
            >
              <div className="px-4 py-3 border-b border-white/10">
                <p className="text-white font-semibold text-sm">Notifications</p>
              </div>
              <div className="divide-y divide-white/5">
                {notifications.map((n) => (
                  <div key={n.id} className="px-4 py-3 hover:bg-white/5 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className={clsx(
                        'mt-0.5 w-2 h-2 rounded-full flex-shrink-0',
                        n.type === 'warning' ? 'bg-amber-400' :
                        n.type === 'success' ? 'bg-emerald-400' : 'bg-blue-400'
                      )} />
                      <div>
                        <p className="text-dark-200 text-xs">{n.text}</p>
                        <p className="text-dark-500 text-xs mt-0.5">{n.time}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-4 py-2.5">
                <button
                  onClick={() => setNotifOpen(false)}
                  className="text-brand-400 text-xs hover:text-brand-300 transition-colors"
                >
                  Dismiss all
                </button>
              </div>
            </motion.div>
          )}
        </div>

        {/* User Avatar */}
        <div className="flex items-center gap-2.5 ml-1 pl-3 border-l border-white/10">
          <div className="text-right hidden sm:block">
            <p className="text-white text-sm font-medium leading-none">{session?.displayName}</p>
            <p className="text-dark-400 text-xs mt-0.5 capitalize">{session?.role}</p>
          </div>
          <div className="w-8 h-8 rounded-xl bg-brand-500/20 border border-brand-500/30 flex items-center justify-center">
            <span className="text-brand-400 font-bold text-sm">{session?.avatar ?? '?'}</span>
          </div>
          <button
            onClick={handleLogout}
            title="Logout"
            className="p-1.5 rounded-lg text-dark-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mobile search overlay */}
      {searchOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute top-full left-0 right-0 p-4 bg-dark-950 border-b border-white/10 md:hidden"
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
            <input
              type="text"
              placeholder="Search passwords..."
              autoFocus
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-dark-400 text-sm focus:outline-none focus:border-brand-500/50"
              onChange={(e) => {
                const val = e.target.value;
                navigate(val ? `/passwords?search=${encodeURIComponent(val)}` : '/passwords');
              }}
              onFocus={(e) => {
                if (e.target.value) {
                  navigate(`/passwords?search=${encodeURIComponent(e.target.value)}`);
                } else {
                  navigate('/passwords');
                }
              }}
            />
          </div>
        </motion.div>
      )}
    </motion.header>
  );
}
