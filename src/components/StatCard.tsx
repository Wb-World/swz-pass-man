import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import clsx from 'clsx';

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: number | string;
  color: 'blue' | 'red' | 'green' | 'amber' | 'purple' | 'cyan';
  subtitle?: string;
  delay?: number;
}

const colorMap = {
  blue: {
    icon: 'text-brand-400',
    bg: 'bg-brand-500/10',
    border: 'border-brand-500/20',
    glow: 'shadow-brand-500/10',
    ring: 'ring-brand-500/20',
  },
  red: {
    icon: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/20',
    glow: 'shadow-red-500/10',
    ring: 'ring-red-500/20',
  },
  green: {
    icon: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    glow: 'shadow-emerald-500/10',
    ring: 'ring-emerald-500/20',
  },
  amber: {
    icon: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    glow: 'shadow-amber-500/10',
    ring: 'ring-amber-500/20',
  },
  purple: {
    icon: 'text-purple-400',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/20',
    glow: 'shadow-purple-500/10',
    ring: 'ring-purple-500/20',
  },
  cyan: {
    icon: 'text-cyan-400',
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/20',
    glow: 'shadow-cyan-500/10',
    ring: 'ring-cyan-500/20',
  },
};

export function StatCard({ icon: Icon, label, value, color, subtitle, delay = 0 }: StatCardProps) {
  const c = colorMap[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      whileHover={{ scale: 1.02, translateY: -2 }}
      className={clsx(
        'relative overflow-hidden rounded-2xl border p-5',
        'bg-dark-900/60 backdrop-blur-sm',
        c.border,
        'shadow-lg hover:shadow-xl transition-shadow duration-300'
      )}
    >
      {/* Glow effect */}
      <div className={clsx('absolute -top-8 -right-8 w-24 h-24 rounded-full blur-2xl opacity-30', c.bg)} />

      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-dark-400 text-sm font-medium mb-2">{label}</p>
          <p className="text-3xl font-bold text-white tracking-tight">{value}</p>
          {subtitle && <p className="text-dark-400 text-xs mt-1">{subtitle}</p>}
        </div>
        <div className={clsx('p-3 rounded-xl', c.bg)}>
          <Icon className={clsx('w-6 h-6', c.icon)} />
        </div>
      </div>
    </motion.div>
  );
}
