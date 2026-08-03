import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Settings, User, Shield, Clock, LogOut, Eye, EyeOff, Save,
  Bell, Palette, Download,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { usePasswords } from '@/context/PasswordContext';
import { useSession } from '@/hooks/useSession';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import clsx from 'clsx';

type SettingsTab = 'profile' | 'security' | 'session' | 'appearance' | 'data';

const tabs: { id: SettingsTab; icon: typeof User; label: string }[] = [
  { id: 'profile', icon: User, label: 'Profile' },
  { id: 'security', icon: Shield, label: 'Security' },
  // { id: 'session', icon: Clock, label: 'Session' },
  { id: 'appearance', icon: Palette, label: 'Appearance' },
  { id: 'data', icon: Download, label: 'Data' },
];

export function SettingsPage() {
  const { session, logout } = useAuth();
  const { exportPasswords, stats } = usePasswords();
  const { duration } = useSession();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [notifications, setNotifications] = useState(true);

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPass !== confirmPass) {
      toast.error("Passwords don't match");
      return;
    }
    if (newPass.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    toast.success('Password updated (frontend only — no persistence)');
    setCurrentPass(''); setNewPass(''); setConfirmPass('');
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-5">
      <div>
        <h1 className="text-white font-bold text-xl flex items-center gap-2">
          <Settings className="w-5 h-5 text-brand-400" />
          Settings
        </h1>
        <p className="text-dark-400 text-sm mt-0.5">Manage your account and preferences</p>
      </div>

      <div className="flex gap-6">
        {/* Tab sidebar */}
        <div className="flex-shrink-0 w-48 space-y-1">
          {tabs.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={clsx(
                'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                activeTab === id
                  ? 'bg-brand-500/15 text-brand-400 border border-brand-500/20'
                  : 'text-dark-400 hover:text-white hover:bg-white/5'
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}

          <div className="pt-4">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition-all"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>

        {/* Tab content */}
        <div className="flex-1">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
            className="rounded-2xl bg-dark-900/60 border border-white/8 overflow-hidden"
          >
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="p-6 space-y-5">
                <h2 className="text-white font-semibold">Profile Information</h2>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-brand-500/20 border border-brand-500/30 flex items-center justify-center">
                    <span className="text-brand-400 font-bold text-2xl">{session?.avatar}</span>
                  </div>
                  <div>
                    <p className="text-white font-semibold text-lg">{session?.displayName}</p>
                    <p className="text-dark-400 text-sm capitalize">{session?.role} • {session?.username}</p>
                    <p className="text-dark-500 text-xs mt-0.5">{session?.email}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3.5 rounded-xl bg-dark-800/50 border border-white/5">
                    <p className="text-dark-400 text-xs mb-1">Username</p>
                    <p className="text-white text-sm font-mono">{session?.username}</p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-dark-800/50 border border-white/5">
                    <p className="text-dark-400 text-xs mb-1">Role</p>
                    <p className="text-white text-sm capitalize">{session?.role}</p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-dark-800/50 border border-white/5">
                    <p className="text-dark-400 text-xs mb-1">Email</p>
                    <p className="text-white text-sm">{session?.email ?? '—'}</p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-dark-800/50 border border-white/5">
                    <p className="text-dark-400 text-xs mb-1">Total Passwords</p>
                    <p className="text-white text-sm">{stats.total}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="p-6 space-y-5">
                <h2 className="text-white font-semibold">Security Settings</h2>

                {/* 2FA Badge */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-emerald-400" />
                    <div>
                      <p className="text-white text-sm font-medium">Two-Factor Authentication</p>
                      <p className="text-emerald-400 text-xs">Active — Birthday verification required</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-medium">Enabled</span>
                </div>

                {/* Change Password */}
                <div>
                  <h3 className="text-white text-sm font-semibold mb-3">Change Password</h3>
                  <form onSubmit={handleChangePassword} className="space-y-3">
                    {[
                      { label: 'Current Password', value: currentPass, set: setCurrentPass, show: showCurrentPass, toggle: () => setShowCurrentPass(!showCurrentPass) },
                      { label: 'New Password', value: newPass, set: setNewPass, show: showNewPass, toggle: () => setShowNewPass(!showNewPass) },
                      { label: 'Confirm New Password', value: confirmPass, set: setConfirmPass, show: showNewPass, toggle: () => {} },
                    ].map(({ label, value, set, show, toggle }) => (
                      <div key={label}>
                        <label className="block text-dark-300 text-xs mb-1.5">{label}</label>
                        <div className="relative">
                          <input
                            type={show ? 'text' : 'password'}
                            value={value}
                            onChange={(e) => set(e.target.value)}
                            className="w-full px-3 pr-10 py-2.5 rounded-xl bg-dark-800/80 border border-white/10 text-white text-sm focus:outline-none focus:border-brand-500/50 transition-all"
                          />
                          <button type="button" onClick={toggle} className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 hover:text-white">
                            {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    ))}
                    <button
                      type="submit"
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-400 text-white text-sm font-semibold transition-colors"
                    >
                      <Save className="w-4 h-4" />
                      Update Password
                    </button>
                  </form>
                  <p className="text-dark-500 text-xs mt-2">Note: Password changes are frontend only and not persisted.</p>
                </div>
              </div>
            )}

            {/* Appearance Tab */}
            {activeTab === 'appearance' && (
              <div className="p-6 space-y-5">
                <h2 className="text-white font-semibold">Appearance</h2>
                <div className="flex items-center justify-between p-4 rounded-xl bg-dark-800/50 border border-white/5">
                  <div className="flex items-center gap-3">
                    <Palette className="w-5 h-5 text-brand-400" />
                    <div>
                      <p className="text-white text-sm font-medium">Theme</p>
                      <p className="text-dark-400 text-xs">Current: Dark (Default)</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {['Dark'].map((t) => (
                      <button
                        key={t}
                        className={clsx(
                          'px-3 py-1.5 rounded-lg text-xs font-medium border transition-all',
                          t === 'Dark'
                            ? 'bg-brand-500/20 border-brand-500/30 text-brand-400'
                            : 'border-white/10 text-dark-400 hover:bg-white/5'
                        )}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 rounded-xl bg-dark-800/50 border border-white/5">
                  <div className="flex items-center gap-3">
                    <Bell className="w-5 h-5 text-brand-400" />
                    <div>
                      <p className="text-white text-sm font-medium">Notifications</p>
                      <p className="text-dark-400 text-xs">Security alerts and copy confirmations</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setNotifications(!notifications)}
                    className={clsx(
                      'relative w-11 h-6 rounded-full border transition-all',
                      notifications
                        ? 'bg-brand-500 border-brand-500'
                        : 'bg-dark-700 border-white/10'
                    )}
                  >
                    <div className={clsx(
                      'absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all',
                      notifications ? 'left-5' : 'left-0.5'
                    )} />
                  </button>
                </div>
              </div>
            )}

            {/* Data Tab */}
            {activeTab === 'data' && (
              <div className="p-6 space-y-5">
                <h2 className="text-white font-semibold">Data Management</h2>
                <div className="space-y-3">
                  <div className="p-4 rounded-xl bg-dark-800/50 border border-white/5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white text-sm font-medium">Export Passwords</p>
                        <p className="text-dark-400 text-xs mt-0.5">Download all passwords as JSON</p>
                      </div>
                      <button
                        onClick={() => { exportPasswords(); toast.success('Passwords exported!'); }}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-400 hover:bg-brand-500/20 text-sm transition-colors"
                      >
                        <Download className="w-4 h-4" />
                        Export
                      </button>
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-dark-800/50 border border-white/5">
                    <p className="text-white text-sm font-medium mb-1">Vault Summary</p>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      <div className="text-center p-2 rounded-lg bg-dark-900/60">
                        <p className="text-emerald-400 font-bold">{stats.strong}</p>
                        <p className="text-dark-500 text-xs">Strong</p>
                      </div>
                      <div className="text-center p-2 rounded-lg bg-dark-900/60">
                        <p className="text-amber-400 font-bold">{stats.medium}</p>
                        <p className="text-dark-500 text-xs">Medium</p>
                      </div>
                      <div className="text-center p-2 rounded-lg bg-dark-900/60">
                        <p className="text-red-400 font-bold">{stats.weak}</p>
                        <p className="text-dark-500 text-xs">Weak</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
