import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Shield, Globe, Key, Mail, Users, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export interface MobileNotification {
  id: string;
  title: string;
  message: string;
  type?: 'site' | 'apikey' | 'mail' | 'employee' | 'admin';
  timestamp: string;
}

// Global event bus for immediate local broadcast as well as Supabase Realtime
type NotificationListener = (notif: MobileNotification) => void;
const listeners: NotificationListener[] = [];

export function emitMobileNotification(title: string, message: string, type: MobileNotification['type'] = 'admin') {
  const notif: MobileNotification = {
    id: Math.random().toString(36).substring(2, 9),
    title,
    message,
    type,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };
  listeners.forEach((fn) => fn(notif));
}

export function MobileNotificationBanner() {
  const [currentNotif, setCurrentNotif] = useState<MobileNotification | null>(null);

  useEffect(() => {
    // 1. Subscribe to local broadcaster
    const handler = (notif: MobileNotification) => {
      setCurrentNotif(notif);
    };
    listeners.push(handler);

    // 2. Subscribe to Supabase Realtime Postgres Changes on public tables
    const channel = supabase
      .channel('public:realtime_notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'sites' }, (payload) => {
        const siteName = payload.new?.name || 'A site';
        emitMobileNotification('🔔 Admin Added Site', `New site "${siteName}" was added to company sites.`, 'site');
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'api_keys' }, (payload) => {
        const keyName = payload.new?.name || 'API Key';
        emitMobileNotification('🔑 Admin Added API Key', `New API key "${keyName}" was registered.`, 'apikey');
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'mails' }, (payload) => {
        const mailEmail = payload.new?.email || 'Mail account';
        emitMobileNotification('📧 Admin Added Company Mail', `New mail "${mailEmail}" was added.`, 'mail');
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'emp' }, (payload) => {
        const empName = payload.new?.name || 'Employee';
        emitMobileNotification('👥 Admin Added Employee', `New team member "${empName}" was registered.`, 'employee');
      })
      .subscribe();

    return () => {
      const idx = listeners.indexOf(handler);
      if (idx !== -1) listeners.splice(idx, 1);
      supabase.removeChannel(channel);
    };
  }, []);

  // Auto dismiss after 6 seconds
  useEffect(() => {
    if (currentNotif) {
      const timer = setTimeout(() => {
        setCurrentNotif(null);
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [currentNotif]);

  if (!currentNotif) return null;

  const getIcon = () => {
    switch (currentNotif.type) {
      case 'site':     return <Globe className="w-4 h-4 text-brand-400" />;
      case 'apikey':   return <Key className="w-4 h-4 text-amber-400" />;
      case 'mail':     return <Mail className="w-4 h-4 text-red-400" />;
      case 'employee': return <Users className="w-4 h-4 text-emerald-400" />;
      default:         return <Shield className="w-4 h-4 text-purple-400" />;
    }
  };

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-4 pointer-events-none">
      <AnimatePresence>
        <motion.div
          initial={{ y: -80, opacity: 0, scale: 0.9 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: -80, opacity: 0, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 350, damping: 25 }}
          className="pointer-events-auto w-full bg-dark-900/95 backdrop-blur-2xl border border-brand-500/30 rounded-2xl shadow-2xl shadow-black/80 overflow-hidden ring-1 ring-white/10"
        >
          {/* Top header bar like mobile OS notification */}
          <div className="flex items-center justify-between px-3.5 py-2 bg-white/5 border-b border-white/5 text-[11px] text-dark-400">
            <div className="flex items-center gap-1.5 min-w-0">
              <img src="/brand_logo.jpg" alt="App Logo" className="w-4 h-4 rounded-md object-cover" />
              <span className="font-semibold text-white truncate">Secure Worldz Manager</span>
              <span className="text-dark-500">•</span>
              <span className="text-dark-400">{currentNotif.timestamp}</span>
            </div>
            <button
              onClick={() => setCurrentNotif(null)}
              className="p-1 rounded-md text-dark-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Notification Body */}
          <div className="p-3.5 flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand-500/15 border border-brand-500/20 flex items-center justify-center flex-shrink-0">
              {getIcon()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-bold leading-tight flex items-center gap-1">
                {currentNotif.title}
              </p>
              <p className="text-dark-300 text-xs mt-1 leading-snug">
                {currentNotif.message}
              </p>
            </div>
          </div>

          {/* Animated timer indicator bar at bottom */}
          <motion.div
            initial={{ width: '100%' }}
            animate={{ width: '0%' }}
            transition={{ duration: 6, ease: 'linear' }}
            className="h-0.5 bg-brand-500"
          />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
