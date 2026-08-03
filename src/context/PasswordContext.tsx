import React, { createContext, useContext, useReducer, useCallback, useMemo } from 'react';
import type { PasswordEntry, DashboardStats, Category, PasswordStrength } from '@/types';
import initialPasswords from '@/data/passwords.json';
import { calcSecurityScore, generateId } from '@/utils/passwordUtils';

// ---- State & Actions ----

interface PasswordState {
  passwords: PasswordEntry[];
}

type PasswordAction =
  | { type: 'ADD'; payload: PasswordEntry }
  | { type: 'UPDATE'; payload: { id: string; updates: Partial<PasswordEntry> } }
  | { type: 'DELETE'; payload: string }
  | { type: 'TOGGLE_FAVORITE'; payload: string }
  | { type: 'IMPORT'; payload: PasswordEntry[] };

function passwordReducer(state: PasswordState, action: PasswordAction): PasswordState {
  switch (action.type) {
    case 'ADD':
      return { passwords: [action.payload, ...state.passwords] };
    case 'UPDATE':
      return {
        passwords: state.passwords.map((p) =>
          p.id === action.payload.id
            ? { ...p, ...action.payload.updates, updatedAt: new Date().toISOString() }
            : p
        ),
      };
    case 'DELETE':
      return { passwords: state.passwords.filter((p) => p.id !== action.payload) };
    case 'TOGGLE_FAVORITE':
      return {
        passwords: state.passwords.map((p) =>
          p.id === action.payload ? { ...p, favorite: !p.favorite } : p
        ),
      };
    case 'IMPORT':
      return { passwords: action.payload };
    default:
      return state;
  }
}

// ---- Context ----

interface PasswordContextValue {
  passwords: PasswordEntry[];
  addPassword: (entry: Omit<PasswordEntry, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updatePassword: (id: string, updates: Partial<PasswordEntry>) => void;
  deletePassword: (id: string) => void;
  toggleFavorite: (id: string) => void;
  importPasswords: (entries: PasswordEntry[]) => void;
  exportPasswords: () => void;
  stats: DashboardStats;
}

const PasswordContext = createContext<PasswordContextValue | null>(null);

// ---- Provider ----

export function PasswordProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(passwordReducer, {
    passwords: initialPasswords as PasswordEntry[],
  });

  const addPassword = useCallback(
    (entry: Omit<PasswordEntry, 'id' | 'createdAt' | 'updatedAt'>) => {
      const newEntry: PasswordEntry = {
        ...entry,
        id: generateId(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      dispatch({ type: 'ADD', payload: newEntry });
    },
    []
  );

  const updatePassword = useCallback((id: string, updates: Partial<PasswordEntry>) => {
    dispatch({ type: 'UPDATE', payload: { id, updates } });
  }, []);

  const deletePassword = useCallback((id: string) => {
    dispatch({ type: 'DELETE', payload: id });
  }, []);

  const toggleFavorite = useCallback((id: string) => {
    dispatch({ type: 'TOGGLE_FAVORITE', payload: id });
  }, []);

  const importPasswords = useCallback((entries: PasswordEntry[]) => {
    dispatch({ type: 'IMPORT', payload: entries });
  }, []);

  const exportPasswords = useCallback(() => {
    const json = JSON.stringify(state.passwords, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `swz-passwords-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [state.passwords]);

  // Compute stats
  const stats = useMemo<DashboardStats>(() => {
    const { passwords } = state;
    const now = Date.now();
    const weekAgo = now - 7 * 24 * 60 * 60 * 1000;

    const categoryCounts: Record<string, number> = {};
    passwords.forEach((p) => {
      categoryCounts[p.category] = (categoryCounts[p.category] ?? 0) + 1;
    });

    return {
      total: passwords.length,
      weak: passwords.filter((p) => p.strength === 'weak').length,
      medium: passwords.filter((p) => p.strength === 'medium').length,
      strong: passwords.filter((p) => p.strength === 'strong').length,
      favorites: passwords.filter((p) => p.favorite).length,
      recentlyAdded: passwords.filter((p) => new Date(p.createdAt).getTime() > weekAgo).length,
      securityScore: calcSecurityScore(passwords),
      categories: categoryCounts,
    };
  }, [state.passwords]);

  return (
    <PasswordContext.Provider
      value={{
        passwords: state.passwords,
        addPassword,
        updatePassword,
        deletePassword,
        toggleFavorite,
        importPasswords,
        exportPasswords,
        stats,
      }}
    >
      {children}
    </PasswordContext.Provider>
  );
}

// ---- Hook ----

export function usePasswords(): PasswordContextValue {
  const ctx = useContext(PasswordContext);
  if (!ctx) throw new Error('usePasswords must be used inside PasswordProvider');
  return ctx;
}

// ---- Category helpers ----

export const ALL_CATEGORIES: Category[] = [
  'Gmail Accounts',
  'Admin Credentials',
  'API Keys',
  'CTF Credentials',
  'Social Media',
  'Banking',
  'Other',
];

export const CATEGORY_ICONS: Record<Category, string> = {
  'Gmail Accounts': '📧',
  'Admin Credentials': '🔐',
  'API Keys': '🔑',
  'CTF Credentials': '🚩',
  'Social Media': '📱',
  'Banking': '🏦',
  'Other': '📁',
};

export const STRENGTH_ORDER: Record<PasswordStrength, number> = {
  weak: 0,
  medium: 1,
  strong: 2,
};
