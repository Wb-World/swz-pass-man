import { NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  KeyRound,
  Star,
  FolderOpen,
  Settings,
  LogOut,
  Shield,
  ChevronRight,
} from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';

const navItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/passwords', icon: KeyRound, label: 'Passwords' },
  { path: '/favorites', icon: Star, label: 'Favorites' },
  { path: '/categories', icon: FolderOpen, label: 'Categories' },
  { path: '/settings', icon: Settings, label: 'Settings' },
];

interface SidebarProps {
  collapsed?: boolean;
}

export function Sidebar({ collapsed = false }: SidebarProps) {
  const { session, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  return (
    <motion.aside
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className={clsx(
        'flex flex-col h-screen sticky top-0',
        'bg-dark-950/90 backdrop-blur-xl',
        'border-r border-white/5',
        'transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-white/5">
        <div className="flex-shrink-0 w-9 h-9 rounded-xl overflow-hidden ring-2 ring-brand-500/30">
          <img src="/brand_logo.jpg" alt="Secure Worldz" className="w-full h-full object-cover" />
        </div>
        {!collapsed && (
          <div>
            <p className="text-white font-bold text-sm leading-tight">Secure Worldz</p>
            <p className="text-dark-400 text-xs">Pass Manager</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ path, icon: Icon, label }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group',
                isActive
                  ? 'bg-brand-500/15 text-brand-400 border border-brand-500/20'
                  : 'text-dark-400 hover:text-white hover:bg-white/5'
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon className={clsx('w-4.5 h-4.5 flex-shrink-0', isActive ? 'text-brand-400' : 'text-dark-400 group-hover:text-white')} />
                {!collapsed && <span>{label}</span>}
                {!collapsed && isActive && (
                  <ChevronRight className="ml-auto w-3 h-3 text-brand-400" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Security Badge */}
      {/* {!collapsed && (
        <div className="mx-3 mb-3 px-3 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-400" />
            <div>
              <p className="text-emerald-400 text-xs font-semibold">2FA Enabled</p>
              <p className="text-dark-400 text-xs">Session secured</p>
            </div>
          </div>
        </div>
      )} */}

      {/* User Profile */}
      <div className="border-t border-white/5 px-3 py-3">
        <div className={clsx('flex items-center gap-3', collapsed && 'justify-center')}>
          <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-brand-500/20 border border-brand-500/30 flex items-center justify-center">
            <span className="text-brand-400 font-bold text-sm">{session?.avatar ?? '?'}</span>
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-semibold truncate">{session?.displayName}</p>
              <p className="text-dark-400 text-xs capitalize truncate">{session?.role}</p>
            </div>
          )}
          {!collapsed && (
            <button
              onClick={handleLogout}
              title="Logout"
              className="p-1.5 rounded-lg text-dark-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </motion.aside>
  );
}
