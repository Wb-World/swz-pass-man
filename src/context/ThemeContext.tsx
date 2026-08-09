import React, { createContext, useContext, useState, useEffect } from 'react';

export type ThemeId = 'midnight' | 'cyberpunk' | 'matrix' | 'purple' | 'sunset';

export interface ThemeOption {
  id: ThemeId;
  name: string;
  description: string;
  bg: string;
  cardBg: string;
  primary: string;
  accent: string;
  previewColors: string[];
}

export const THEMES: ThemeOption[] = [
  {
    id: 'midnight',
    name: 'Dark Midnight',
    description: 'Deep navy obsidian theme with crisp indigo accents (Default)',
    bg: '#0b0f19',
    cardBg: '#131927',
    primary: '#4f63f0',
    accent: '#6366f1',
    previewColors: ['#0b0f19', '#131927', '#4f63f0'],
  },
  {
    id: 'cyberpunk',
    name: 'Neon Cyberpunk',
    description: 'Pitch black stealth with vibrant neon cyan and hot pink glow',
    bg: '#05050a',
    cardBg: '#0e0e1a',
    primary: '#00f0ff',
    accent: '#ff007f',
    previewColors: ['#05050a', '#0e0e1a', '#00f0ff', '#ff007f'],
  },
  {
    id: 'matrix',
    name: 'Emerald Matrix',
    description: 'Deep hacker slate green with glowing emerald accents',
    bg: '#06120e',
    cardBg: '#0d1f19',
    primary: '#10b981',
    accent: '#34d399',
    previewColors: ['#06120e', '#0d1f19', '#10b981'],
  },
  {
    id: 'purple',
    name: 'Purple Haze',
    description: 'Royal violet darkness with glowing purple & magenta accents',
    bg: '#0e0918',
    cardBg: '#1a122b',
    primary: '#a855f7',
    accent: '#c084fc',
    previewColors: ['#0e0918', '#1a122b', '#a855f7'],
  },
  {
    id: 'sunset',
    name: 'Sunset Gold',
    description: 'Dark warm charcoal with glowing amber & gold accents',
    bg: '#14100c',
    cardBg: '#211a14',
    primary: '#f59e0b',
    accent: '#fbbf24',
    previewColors: ['#14100c', '#211a14', '#f59e0b'],
  },
];

interface ThemeContextType {
  theme: ThemeId;
  setTheme: (t: ThemeId) => void;
  currentTheme: ThemeOption;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeId>(() => {
    return (localStorage.getItem('swz_theme') as ThemeId) || 'midnight';
  });

  const setTheme = (newTheme: ThemeId) => {
    setThemeState(newTheme);
    localStorage.setItem('swz_theme', newTheme);
  };

  const currentTheme = THEMES.find((t) => t.id === theme) || THEMES[0];

  useEffect(() => {
    // Apply data-theme attribute on <html> element
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.style.setProperty('--color-brand-primary', currentTheme.primary);
  }, [theme, currentTheme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, currentTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
