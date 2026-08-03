import { type PasswordStrength } from '@/types';
import { getStrengthColors, getStrengthLabel } from '@/utils/passwordUtils';
import clsx from 'clsx';

interface StrengthBadgeProps {
  strength: PasswordStrength;
  size?: 'sm' | 'md';
}

export function StrengthBadge({ strength, size = 'md' }: StrengthBadgeProps) {
  const colors = getStrengthColors(strength);
  const label = getStrengthLabel(strength);

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-full font-medium border',
        colors.bg,
        colors.text,
        colors.border,
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'
      )}
    >
      <span className={clsx('rounded-full', colors.dot, size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2')} />
      {label}
    </span>
  );
}
