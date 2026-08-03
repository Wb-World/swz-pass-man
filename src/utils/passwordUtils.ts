import type { PasswordStrength } from '@/types';

/**
 * Calculate password strength score (0–100)
 */
export function calcStrengthScore(password: string): number {
  if (!password) return 0;
  let score = 0;

  // Length
  if (password.length >= 8) score += 15;
  if (password.length >= 12) score += 15;
  if (password.length >= 16) score += 10;
  if (password.length >= 20) score += 10;

  // Character diversity
  if (/[a-z]/.test(password)) score += 10;
  if (/[A-Z]/.test(password)) score += 10;
  if (/[0-9]/.test(password)) score += 10;
  if (/[^a-zA-Z0-9]/.test(password)) score += 20;

  // No common patterns
  if (!/(.)\1{2,}/.test(password)) score += 5; // no repeated chars
  if (!/(?:abc|123|qwerty|password|pass|admin)/i.test(password)) score += 5;

  return Math.min(100, score);
}

/**
 * Get strength label from password string
 */
export function getStrength(password: string): PasswordStrength {
  const score = calcStrengthScore(password);
  if (score >= 70) return 'strong';
  if (score >= 40) return 'medium';
  return 'weak';
}

/**
 * Get display label for strength
 */
export function getStrengthLabel(strength: PasswordStrength): string {
  switch (strength) {
    case 'strong': return 'Strong';
    case 'medium': return 'Medium';
    case 'weak': return 'Weak';
  }
}

/**
 * Get Tailwind color classes for strength
 */
export function getStrengthColors(strength: PasswordStrength): {
  bg: string; text: string; border: string; dot: string;
} {
  switch (strength) {
    case 'strong':
      return {
        bg: 'bg-emerald-500/20',
        text: 'text-emerald-400',
        border: 'border-emerald-500/30',
        dot: 'bg-emerald-400',
      };
    case 'medium':
      return {
        bg: 'bg-amber-500/20',
        text: 'text-amber-400',
        border: 'border-amber-500/30',
        dot: 'bg-amber-400',
      };
    case 'weak':
      return {
        bg: 'bg-red-500/20',
        text: 'text-red-400',
        border: 'border-red-500/30',
        dot: 'bg-red-400',
      };
  }
}

/**
 * Calculate overall security score based on passwords array
 */
export function calcSecurityScore(passwords: { strength: PasswordStrength }[]): number {
  if (passwords.length === 0) return 0;
  const weights = { strong: 100, medium: 50, weak: 10 };
  const total = passwords.reduce((sum, p) => sum + weights[p.strength], 0);
  return Math.round(total / passwords.length);
}

/**
 * Mask password with bullets
 */
export function maskPassword(password: string): string {
  return '•'.repeat(Math.min(password.length, 16));
}

/**
 * Generate a unique ID
 */
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}
