import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Settings,
  LogOut,
  ChevronRight,
  ChevronLeft,
  Users,
  Globe,
  Mail,
  Key,
  ShieldAlert,
  X,
} from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';

// Primary Navigation items
const primaryNavItems = [
  { path: '/sites',     icon: Globe, label: 'Sites' },
  { path: '/our-mails', icon: Mail,  label: 'Gmails' },
  { path: '/api-keys',  icon: Key,   label: 'API Keys' },
  { path: '/employees', icon: Users, label: 'Employees' },
];

const bottomNavItems = [
  { path: '/settings', icon: Settings, label: 'Settings' },
];

interface SidebarProps {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  isMobile?: boolean;
  onCloseMobile?: () => void;
}

export function Sidebar({
  collapsed = true, // default compressed on desktop per requirement
  onToggleCollapse,
  isMobile = false,
  onCloseMobile,
}: SidebarProps) {
  const { session, logout } = useAuth();
  const navigate = useNavigate();
  const isAdmin = session?.role === 'admin' || session?.role === 'root';
  const [isHovered, setIsHovered] = useState(false);

  // If mobile drawer, always elaborate. If desktop, elaborate when mouse hovers over nav!
  const isExpanded = isMobile || !collapsed || isHovered;

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const NavItem = ({
    path,
    icon: Icon,
    label,
  }: {
    path: string;
    icon: typeof Globe;
    label: string;
  }) => (
    <NavLink
      key={path}
      to={path}
      onClick={() => {
        if (isMobile && onCloseMobile) onCloseMobile();
      }}
      className={({ isActive }) =>
        clsx(
          'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group',
          isActive
            ? 'bg-brand-500/15 text-brand-400 border border-brand-500/20 shadow-sm shadow-brand-500/10'
            : 'text-dark-400 hover:text-white hover:bg-white/5'
        )
      }
    >
      {({ isActive }) => (
        <>
          <Icon
            className={clsx(
              'w-4.5 h-4.5 flex-shrink-0 transition-colors',
              isActive ? 'text-brand-400' : 'text-dark-400 group-hover:text-white'
            )}
          />
          {isExpanded && <span className="truncate">{label}</span>}
          {isExpanded && isActive && (
            <ChevronRight className="ml-auto w-3.5 h-3.5 text-brand-400" />
          )}
        </>
      )}
    </NavLink>
  );

  return (
    <motion.aside
      onMouseEnter={() => !isMobile && setIsHovered(true)}
      onMouseLeave={() => !isMobile && setIsHovered(false)}
      initial={{ width: isMobile ? '18rem' : isExpanded ? '16rem' : '4rem' }}
      animate={{ width: isMobile ? '18rem' : isExpanded ? '16rem' : '4rem' }}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
      className={clsx(
        'flex flex-col h-full bg-dark-950/95 backdrop-blur-xl border-r border-white/5 z-40 select-none overflow-hidden transition-shadow duration-300',
        isMobile ? 'w-72 shadow-2xl' : isExpanded ? 'shadow-2xl shadow-brand-500/5' : ''
      )}
    >
      {/* Header / Logo */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-white/5 h-16 flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex-shrink-0 w-9 h-9 rounded-xl overflow-hidden ring-2 ring-brand-500/30">
            <img src="/brand_logo.jpg" alt="Secure Worldz Manager" className="w-full h-full object-cover" />
          </div>
          {isExpanded && (
            <div className="min-w-0">
              <p className="text-white font-bold text-sm leading-tight truncate">Secure Worldz Manager</p>
              <p className="text-dark-400 text-xs truncate">Enterprise System</p>
            </div>
          )}
        </div>

        {/* Mobile close or collapse toggle */}
        {isMobile ? (
          <button
            onClick={onCloseMobile}
            className="p-1.5 rounded-lg text-dark-400 hover:text-white hover:bg-white/5"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        ) : (
          onToggleCollapse && isExpanded && (
            <button
              onClick={onToggleCollapse}
              className="p-1.5 rounded-lg text-dark-400 hover:text-white hover:bg-white/5 transition-colors ml-auto"
              title={collapsed ? 'Pin expanded' : 'Compress sidebar'}
            >
              {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          )
        )}
      </div>

      {/* Main Nav Items */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-hide">
        {/* Navigation section label */}
        {isExpanded && (
          <p className="text-dark-600 text-[10px] font-semibold uppercase tracking-wider px-3 pt-1 pb-1">
            Navigation
          </p>
        )}
        {primaryNavItems.map((item) => (
          <NavItem key={item.path} {...item} />
        ))}

        {/* Admin Section */}
        {isAdmin && (
          <>
            {isExpanded ? (
              <p className="text-dark-600 text-[10px] font-semibold uppercase tracking-wider px-3 pt-4 pb-1">
                Admin Panel
              </p>
            ) : (
              <div className="my-2 border-t border-white/5" />
            )}
            <NavLink
              to="/admin"
              onClick={() => {
                if (isMobile && onCloseMobile) onCloseMobile();
              }}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group',
                  isActive
                    ? 'bg-red-500/15 text-red-400 border border-red-500/20 shadow-sm shadow-red-500/10'
                    : 'text-dark-400 hover:text-red-400 hover:bg-red-500/5'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <ShieldAlert
                    className={clsx(
                      'w-4.5 h-4.5 flex-shrink-0 transition-colors',
                      isActive ? 'text-red-400' : 'text-dark-400 group-hover:text-red-400'
                    )}
                  />
                  {isExpanded && <span className="truncate">Admin Panel</span>}
                  {isExpanded && isActive && (
                    <ChevronRight className="ml-auto w-3.5 h-3.5 text-red-400" />
                  )}
                </>
              )}
            </NavLink>
          </>
        )}

        {/* Settings */}
        <div className="my-2 border-t border-white/5" />
        {bottomNavItems.map((item) => (
          <NavItem key={item.path} {...item} />
        ))}
      </nav>

      {/* User Footer Profile */}
      <div className="border-t border-white/5 px-3 py-3 flex-shrink-0">
        <div className={clsx('flex items-center gap-3', !isExpanded && 'justify-center')}>
          <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-brand-500/20 border border-brand-500/30 flex items-center justify-center">
            <span className="text-brand-400 font-bold text-sm">{session?.avatar ?? '?'}</span>
          </div>
          {isExpanded && (
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-semibold truncate">{session?.displayName}</p>
              <p className="text-dark-400 text-xs capitalize truncate">{session?.role}</p>
            </div>
          )}
          {isExpanded && (
            <button
              onClick={handleLogout}
              title="Logout"
              className="p-1.5 rounded-lg text-dark-400 hover:text-red-400 hover:bg-red-500/10 transition-colors ml-auto"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </motion.aside>
  );
}
