// =====================================================
// Core Types for SWZ Pass Manager
// =====================================================

export type PasswordStrength = 'weak' | 'medium' | 'strong';

export type UserRole = 'root' | 'admin' | 'viewer';

export type Category =
  | 'Gmail Accounts'
  | 'Admin Credentials'
  | 'API Keys'
  | 'CTF Credentials'
  | 'Social Media'
  | 'Banking'
  | 'Other';

// ---- User & Auth ----

export interface AuthUser {
  id: string;
  username: string;
  password: string;
  role: UserRole;
  displayName: string;
  avatar: string;
  email: string;
  lastLogin: string;
}

export interface SessionInfo {
  isAuthenticated: boolean;
  is2FAVerified: boolean;
  username: string;
  displayName: string;
  role: UserRole;
  loginTime: string;
  avatar: string;
  email: string;
}

export interface AuthState {
  session: SessionInfo | null;
  loading: boolean;
  error: string | null;
}

// ---- Password Entry ----

export interface PasswordEntry {
  id: string;
  website: string;
  url: string;
  username: string;
  email: string;
  password: string;
  category: Category;
  favorite: boolean;
  notes: string;
  strength: PasswordStrength;
  createdAt: string;
  updatedAt: string;
  tags: string[];
}

// ---- Dashboard Stats ----

export interface DashboardStats {
  total: number;
  weak: number;
  medium: number;
  strong: number;
  favorites: number;
  recentlyAdded: number;
  securityScore: number;
  categories: Record<string, number>;
}

// ---- Password Context ----

export interface PasswordContextType {
  passwords: PasswordEntry[];
  addPassword: (entry: Omit<PasswordEntry, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updatePassword: (id: string, updates: Partial<PasswordEntry>) => void;
  deletePassword: (id: string) => void;
  toggleFavorite: (id: string) => void;
  importPasswords: (entries: PasswordEntry[]) => void;
  exportPasswords: () => void;
  stats: DashboardStats;
}

// ---- Filter & Sort ----

export type SortField = 'website' | 'username' | 'email' | 'category' | 'createdAt' | 'strength';
export type SortDirection = 'asc' | 'desc';

export interface FilterOptions {
  search: string;
  category: Category | 'All';
  strength: PasswordStrength | 'All';
  favorites: boolean;
  sortField: SortField;
  sortDirection: SortDirection;
}

// ---- Toast Notification ----
export type ToastType = 'success' | 'error' | 'info' | 'warning';

// ---- Login History (simulated) ----
export interface LoginHistoryEntry {
  id: string;
  timestamp: string;
  success: boolean;
  ipAddress: string;
  device: string;
  location: string;
}
