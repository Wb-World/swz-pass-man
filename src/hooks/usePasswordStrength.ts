import { useMemo } from 'react';
import { calcStrengthScore, getStrength } from '@/utils/passwordUtils';
import type { PasswordStrength } from '@/types';

interface PasswordStrengthResult {
  score: number;
  strength: PasswordStrength;
  label: string;
  color: string;
  bgColor: string;
  barWidth: string;
  tips: string[];
}

/**
 * Hook to compute password strength details
 */
export function usePasswordStrength(password: string): PasswordStrengthResult {
  return useMemo(() => {
    const score = calcStrengthScore(password);
    const strength = getStrength(password);

    const tips: string[] = [];
    if (password.length < 12) tips.push('Use at least 12 characters');
    if (!/[A-Z]/.test(password)) tips.push('Add uppercase letters');
    if (!/[0-9]/.test(password)) tips.push('Add numbers');
    if (!/[^a-zA-Z0-9]/.test(password)) tips.push('Add special characters (!@#$%)');

    const colorMap: Record<PasswordStrength, string> = {
      weak: '#ef4444',
      medium: '#f59e0b',
      strong: '#10b981',
    };

    const bgMap: Record<PasswordStrength, string> = {
      weak: 'rgba(239,68,68,0.15)',
      medium: 'rgba(245,158,11,0.15)',
      strong: 'rgba(16,185,129,0.15)',
    };

    const labelMap: Record<PasswordStrength, string> = {
      weak: 'Weak',
      medium: 'Medium',
      strong: 'Strong',
    };

    return {
      score,
      strength,
      label: labelMap[strength],
      color: colorMap[strength],
      bgColor: bgMap[strength],
      barWidth: `${score}%`,
      tips,
    };
  }, [password]);
}
