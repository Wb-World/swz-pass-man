import React, { createContext, useContext, useReducer, useCallback, useMemo, useEffect } from 'react';
import type { PasswordEntry, DashboardStats, Category, PasswordStrength } from '@/types';
import { supabase } from '@/lib/supabase';
import { calcSecurityScore } from '@/utils/passwordUtils';
import { getStrength } from '@/utils/passwordUtils';
import toast from 'react-hot-toast';

// ---- State & Actions ----

interface PasswordState {
  passwords: PasswordEntry[];
  loading: boolean;
  error: string | null;
}

type PasswordAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'SET_PASSWORDS'; payload: PasswordEntry[] }
  | { type: 'ADD'; payload: PasswordEntry }
  | { type: 'UPDATE'; payload: { id: string; updates: Partial<PasswordEntry> } }
  | { type: 'DELETE'; payload: string }
  | { type: 'TOGGLE_FAVORITE'; payload: { id: string; value: boolean } };

function passwordReducer(state: PasswordState, action: PasswordAction): PasswordState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'SET_PASSWORDS':
      return { passwords: action.payload, loading: false, error: null };
    case 'ADD':
      return { ...state, passwords: [action.payload, ...state.passwords] };
    case 'UPDATE':
      return {
        ...state,
        passwords: state.passwords.map((p) =>
          p.id === action.payload.id
            ? { ...p, ...action.payload.updates, updatedAt: new Date().toISOString() }
            : p
        ),
      };
    case 'DELETE':
      return { ...state, passwords: state.passwords.filter((p) => p.id !== action.payload) };
    case 'TOGGLE_FAVORITE':
      return {
        ...state,
        passwords: state.passwords.map((p) =>
          p.id === action.payload.id ? { ...p, favorite: action.payload.value } : p
        ),
      };
    default:
      return state;
  }
}

// ---- Context ----

interface PasswordContextValue {
  passwords: PasswordEntry[];
  loading: boolean;
  error: string | null;
  addPassword: (entry: Omit<PasswordEntry, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updatePassword: (id: string, updates: Partial<PasswordEntry>) => Promise<void>;
  deletePassword: (id: string) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
  importPasswords: (entries: PasswordEntry[]) => void;
  exportPasswords: () => void;
  stats: DashboardStats;
}

const PasswordContext = createContext<PasswordContextValue | null>(null);

// Map Supabase row to PasswordEntry (camelCase)
function mapRow(row: Record<string, unknown>): PasswordEntry {
  return {
    id: row.id as string,
    website: row.website as string,
    url: (row.url as string) ?? '',
    username: (row.username as string) ?? '',
    email: (row.email as string) ?? '',
    password: row.password as string,
    category: (row.category as Category) ?? 'Other',
    favorite: (row.favorite as boolean) ?? false,
    notes: (row.notes as string) ?? '',
    strength: (row.strength as PasswordStrength) ?? 'weak',
    tags: (row.tags as string[]) ?? [],
    createdAt: (row.created_at as string) ?? new Date().toISOString(),
    updatedAt: (row.updated_at as string) ?? new Date().toISOString(),
  };
}

// ---- Provider ----

export function PasswordProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(passwordReducer, {
    passwords: [],
    loading: true,
    error: null,
  });

  // Fetch all passwords from Supabase on mount
  useEffect(() => {
    let mounted = true;

    const fetchPasswords = async () => {
      dispatch({ type: 'SET_LOADING', payload: true });
      const { data, error } = await supabase
        .from('password_entries')
        .select('*')
        .order('updated_at', { ascending: false });

      if (!mounted) return;

      if (error) {
        dispatch({ type: 'SET_ERROR', payload: error.message });
      } else {
        dispatch({ type: 'SET_PASSWORDS', payload: ((data as Record<string, unknown>[]) ?? []).map(mapRow) });
      }
    };

    fetchPasswords();
    return () => { mounted = false; };
  }, []);

  const addPassword = useCallback(
    async (entry: Omit<PasswordEntry, 'id' | 'createdAt' | 'updatedAt'>) => {
      const strength = getStrength(entry.password);
      const payload = {
        website: entry.website,
        url: entry.url,
        username: entry.username,
        email: entry.email,
        password: entry.password,
        category: entry.category,
        favorite: entry.favorite,
        notes: entry.notes,
        strength,
        tags: entry.tags,
      };

      const { data, error } = await supabase
        .from('password_entries')
        .insert(payload as any)
        .select()
        .single();

      if (error) {
        toast.error('Failed to add password');
        console.error(error);
      } else if (data) {
        dispatch({ type: 'ADD', payload: mapRow(data as Record<string, unknown>) });
      }
    },
    []
  );

  const updatePassword = useCallback(async (id: string, updates: Partial<PasswordEntry>) => {
    const dbUpdates: Record<string, unknown> = {};
    if (updates.website   !== undefined) dbUpdates.website   = updates.website;
    if (updates.url       !== undefined) dbUpdates.url       = updates.url;
    if (updates.username  !== undefined) dbUpdates.username  = updates.username;
    if (updates.email     !== undefined) dbUpdates.email     = updates.email;
    if (updates.password  !== undefined) {
      dbUpdates.password = updates.password;
      dbUpdates.strength = getStrength(updates.password);
    }
    if (updates.category  !== undefined) dbUpdates.category  = updates.category;
    if (updates.favorite  !== undefined) dbUpdates.favorite  = updates.favorite;
    if (updates.notes     !== undefined) dbUpdates.notes     = updates.notes;
    if (updates.tags      !== undefined) dbUpdates.tags      = updates.tags;

    const { error } = await supabase
      .from('password_entries')
      .update(dbUpdates as any)
      .eq('id', id);

    if (error) {
      toast.error('Failed to update password');
      console.error(error);
    } else {
      dispatch({ type: 'UPDATE', payload: { id, updates } });
    }
  }, []);

  const deletePassword = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('password_entries')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete password');
      console.error(error);
    } else {
      dispatch({ type: 'DELETE', payload: id });
    }
  }, []);

  const toggleFavorite = useCallback(async (id: string) => {
    const entry = state.passwords.find((p) => p.id === id);
    if (!entry) return;
    const newValue = !entry.favorite;

    const { error } = await supabase
      .from('password_entries')
      .update({ favorite: newValue } as any)
      .eq('id', id);

    if (error) {
      toast.error('Failed to update favorite');
    } else {
      dispatch({ type: 'TOGGLE_FAVORITE', payload: { id, value: newValue } });
    }
  }, [state.passwords]);

  const importPasswords = useCallback((entries: PasswordEntry[]) => {
    dispatch({ type: 'SET_PASSWORDS', payload: entries });
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

  // Compute dashboard stats
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
        loading: state.loading,
        error: state.error,
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
