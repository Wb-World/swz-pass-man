import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Eye, EyeOff, Copy, Star, ExternalLink, Trash2, Pencil,
  Globe, ChevronUp, ChevronDown, Filter, Download, Upload,
  Plus, Check, MoreHorizontal, X, Save,
} from 'lucide-react';
import { usePasswords } from '@/context/PasswordContext';
import { SearchBar } from '@/components/SearchBar';
import { StrengthBadge } from '@/components/StrengthBadge';
import { Modal } from '@/components/Modal';
import { useClipboard } from '@/hooks/useClipboard';
import type { PasswordEntry, Category, PasswordStrength, SortField, SortDirection } from '@/types';
import { ALL_CATEGORIES, CATEGORY_ICONS } from '@/context/PasswordContext';
import { maskPassword, getStrength, generateId } from '@/utils/passwordUtils';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import clsx from 'clsx';

// ---- Add/Edit Form Component ----
interface PasswordFormProps {
  initial?: Partial<PasswordEntry>;
  onSave: (data: Omit<PasswordEntry, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onClose: () => void;
}

function PasswordForm({ initial, onSave, onClose }: PasswordFormProps) {
  const [form, setForm] = useState({
    website: initial?.website ?? '',
    url: initial?.url ?? '',
    username: initial?.username ?? '',
    email: initial?.email ?? '',
    password: initial?.password ?? '',
    category: (initial?.category ?? 'Other') as Category,
    notes: initial?.notes ?? '',
    favorite: initial?.favorite ?? false,
    tags: initial?.tags ?? [],
  });
  const [showPass, setShowPass] = useState(false);

  const strength = getStrength(form.password);

  const handleSave = () => {
    if (!form.website || !form.password) {
      toast.error('Website and password are required');
      return;
    }
    onSave({ ...form, strength });
  };

  return (
    <div className="p-6 space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-dark-300 text-xs font-medium mb-1.5">Website *</label>
          <input
            type="text"
            value={form.website}
            onChange={(e) => setForm({ ...form, website: e.target.value })}
            placeholder="e.g. Gmail"
            className="w-full px-3 py-2.5 rounded-xl bg-dark-800/80 border border-white/10 text-white text-sm placeholder-dark-500 focus:outline-none focus:border-brand-500/50 transition-all"
          />
        </div>
        <div>
          <label className="block text-dark-300 text-xs font-medium mb-1.5">URL</label>
          <input
            type="text"
            value={form.url}
            onChange={(e) => setForm({ ...form, url: e.target.value })}
            placeholder="https://..."
            className="w-full px-3 py-2.5 rounded-xl bg-dark-800/80 border border-white/10 text-white text-sm placeholder-dark-500 focus:outline-none focus:border-brand-500/50 transition-all"
          />
        </div>
        <div>
          <label className="block text-dark-300 text-xs font-medium mb-1.5">Username</label>
          <input
            type="text"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            placeholder="Username"
            className="w-full px-3 py-2.5 rounded-xl bg-dark-800/80 border border-white/10 text-white text-sm placeholder-dark-500 focus:outline-none focus:border-brand-500/50 transition-all"
          />
        </div>
        <div>
          <label className="block text-dark-300 text-xs font-medium mb-1.5">Email</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="email@example.com"
            className="w-full px-3 py-2.5 rounded-xl bg-dark-800/80 border border-white/10 text-white text-sm placeholder-dark-500 focus:outline-none focus:border-brand-500/50 transition-all"
          />
        </div>
      </div>
      <div>
        <label className="block text-dark-300 text-xs font-medium mb-1.5">Password *</label>
        <div className="relative">
          <input
            type={showPass ? 'text' : 'password'}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="Enter password"
            className="w-full px-3 pr-10 py-2.5 rounded-xl bg-dark-800/80 border border-white/10 text-white text-sm font-mono placeholder-dark-500 focus:outline-none focus:border-brand-500/50 transition-all"
          />
          <button
            type="button"
            onClick={() => setShowPass(!showPass)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 hover:text-white"
          >
            {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {form.password && (
          <div className="mt-2">
            <StrengthBadge strength={strength} size="sm" />
          </div>
        )}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-dark-300 text-xs font-medium mb-1.5">Category</label>
          <select
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value as Category })}
            className="w-full px-3 py-2.5 rounded-xl bg-dark-800/80 border border-white/10 text-white text-sm focus:outline-none focus:border-brand-500/50 transition-all"
          >
            {ALL_CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-dark-300 text-xs font-medium mb-1.5">Notes</label>
          <input
            type="text"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            placeholder="Optional notes"
            className="w-full px-3 py-2.5 rounded-xl bg-dark-800/80 border border-white/10 text-white text-sm placeholder-dark-500 focus:outline-none focus:border-brand-500/50 transition-all"
          />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="favorite-check"
          checked={form.favorite}
          onChange={(e) => setForm({ ...form, favorite: e.target.checked })}
          className="w-4 h-4 rounded border-white/20 bg-dark-800 text-brand-500"
        />
        <label htmlFor="favorite-check" className="text-dark-300 text-sm cursor-pointer">Mark as Favorite</label>
      </div>
      <div className="flex gap-3 pt-2">
        <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-white/10 text-dark-300 text-sm hover:bg-white/5 transition-colors">
          Cancel
        </button>
        <button
          onClick={handleSave}
          className="flex-1 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-400 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
        >
          <Save className="w-4 h-4" />
          Save
        </button>
      </div>
    </div>
  );
}

// ---- View Details Modal ----
function PasswordDetailModal({ entry, onClose, onEdit, onDelete }: {
  entry: PasswordEntry;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [showPass, setShowPass] = useState(false);
  const { copy } = useClipboard();

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-dark-800 border border-white/10 flex items-center justify-center">
          <Globe className="w-6 h-6 text-dark-400" />
        </div>
        <div>
          <h3 className="text-white font-bold text-lg">{entry.website}</h3>
          <p className="text-dark-400 text-sm">{entry.category}</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <StrengthBadge strength={entry.strength} />
          {entry.favorite && <Star className="w-4 h-4 text-amber-400 fill-amber-400" />}
        </div>
      </div>

      <div className="h-px bg-white/5" />

      {/* Fields */}
      <div className="space-y-3">
        {entry.email && (
          <div className="flex items-center justify-between p-3 rounded-xl bg-dark-800/50 border border-white/5">
            <div>
              <p className="text-dark-400 text-xs">Email</p>
              <p className="text-white text-sm font-mono">{entry.email}</p>
            </div>
            <button onClick={() => copy(entry.email, 'email', 'Email')} className="p-2 rounded-lg hover:bg-white/10 text-dark-400 hover:text-white transition-colors">
              <Copy className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
        {entry.username && (
          <div className="flex items-center justify-between p-3 rounded-xl bg-dark-800/50 border border-white/5">
            <div>
              <p className="text-dark-400 text-xs">Username</p>
              <p className="text-white text-sm font-mono">{entry.username}</p>
            </div>
            <button onClick={() => copy(entry.username, 'username', 'Username')} className="p-2 rounded-lg hover:bg-white/10 text-dark-400 hover:text-white transition-colors">
              <Copy className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
        <div className="flex items-center justify-between p-3 rounded-xl bg-dark-800/50 border border-white/5">
          <div>
            <p className="text-dark-400 text-xs">Password</p>
            <p className="text-white text-sm font-mono tracking-wider">
              {showPass ? entry.password : maskPassword(entry.password)}
            </p>
          </div>
          <div className="flex gap-1">
            <button onClick={() => setShowPass(!showPass)} className="p-2 rounded-lg hover:bg-white/10 text-dark-400 hover:text-white transition-colors">
              {showPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
            <button onClick={() => copy(entry.password, 'password', 'Password')} className="p-2 rounded-lg hover:bg-white/10 text-dark-400 hover:text-white transition-colors">
              <Copy className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        {entry.url && (
          <div className="flex items-center justify-between p-3 rounded-xl bg-dark-800/50 border border-white/5">
            <div>
              <p className="text-dark-400 text-xs">Website URL</p>
              <p className="text-brand-400 text-sm">{entry.url}</p>
            </div>
            <a href={entry.url} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg hover:bg-white/10 text-dark-400 hover:text-white transition-colors">
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        )}
        {entry.notes && (
          <div className="p-3 rounded-xl bg-dark-800/50 border border-white/5">
            <p className="text-dark-400 text-xs mb-1">Notes</p>
            <p className="text-dark-200 text-sm">{entry.notes}</p>
          </div>
        )}
      </div>

      <div className="h-px bg-white/5" />
      <div className="flex items-center justify-between text-xs text-dark-500">
        <span>Created {format(new Date(entry.createdAt), 'MMM d, yyyy')}</span>
        <span>Updated {format(new Date(entry.updatedAt), 'MMM d, yyyy')}</span>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onDelete}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500/20 text-sm transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Delete
        </button>
        <button
          onClick={onEdit}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-400 text-white text-sm font-medium transition-colors"
        >
          <Pencil className="w-3.5 h-3.5" />
          Edit
        </button>
      </div>
    </div>
  );
}

// ---- Main Passwords Page ----
export function PasswordsPage() {
  const { passwords, toggleFavorite, deletePassword, addPassword, updatePassword, exportPasswords, importPasswords } = usePasswords();
  const { copy, copiedId } = useClipboard();
  const [searchParams, setSearchParams] = useSearchParams();

  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState<Category | 'All'>(
    (searchParams.get('category') as Category) || 'All'
  );
  const [selectedStrength, setSelectedStrength] = useState<PasswordStrength | 'All'>('All');
  const [sortField, setSortField] = useState<SortField>('website');
  const [sortDir, setSortDir] = useState<SortDirection>('asc');
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());
  const [viewEntry, setViewEntry] = useState<PasswordEntry | null>(null);
  const [editEntry, setEditEntry] = useState<PasswordEntry | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(!!searchParams.get('category'));

  // Sync state with URL params when URL changes
  useEffect(() => {
    const catParam = searchParams.get('category') as Category | null;
    const searchParam = searchParams.get('search');

    if (catParam && ALL_CATEGORIES.includes(catParam)) {
      setSelectedCategory(catParam);
      setShowFilters(true);
    }
    if (searchParam !== null) {
      setSearch(searchParam);
    }
  }, [searchParams]);

  const handleSearchChange = (val: string) => {
    setSearch(val);
    const newParams = new URLSearchParams(searchParams);
    if (val) {
      newParams.set('search', val);
    } else {
      newParams.delete('search');
    }
    setSearchParams(newParams, { replace: true });
  };

  const handleCategoryChange = (cat: Category | 'All') => {
    setSelectedCategory(cat);
    const newParams = new URLSearchParams(searchParams);
    if (cat !== 'All') {
      newParams.set('category', cat);
    } else {
      newParams.delete('category');
    }
    setSearchParams(newParams, { replace: true });
  };

  const toggleReveal = (id: string) => {
    setRevealedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ChevronDown className="w-3 h-3 text-dark-600" />;
    return sortDir === 'asc'
      ? <ChevronUp className="w-3 h-3 text-brand-400" />
      : <ChevronDown className="w-3 h-3 text-brand-400" />;
  };

  const filtered = useMemo(() => {
    let list = [...passwords];
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((p) =>
        (p.website && p.website.toLowerCase().includes(q)) ||
        (p.username && p.username.toLowerCase().includes(q)) ||
        (p.email && p.email.toLowerCase().includes(q)) ||
        (p.password && p.password.toLowerCase().includes(q)) ||
        (p.category && p.category.toLowerCase().includes(q)) ||
        (p.notes && p.notes.toLowerCase().includes(q)) ||
        (p.url && p.url.toLowerCase().includes(q)) ||
        (p.tags && p.tags.some((t) => t.toLowerCase().includes(q)))
      );
    }
    if (selectedCategory !== 'All') {
      list = list.filter((p) => p.category === selectedCategory);
    }
    if (selectedStrength !== 'All') {
      list = list.filter((p) => p.strength === selectedStrength);
    }

    list.sort((a, b) => {
      let va = '', vb = '';
      if (sortField === 'createdAt') {
        return sortDir === 'asc'
          ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      va = String((a as unknown as Record<string, unknown>)[sortField] ?? '').toLowerCase();
      vb = String((b as unknown as Record<string, unknown>)[sortField] ?? '').toLowerCase();
      return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
    });

    return list;
  }, [passwords, search, selectedCategory, selectedStrength, sortField, sortDir]);

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string) as PasswordEntry[];
        importPasswords(data);
        toast.success(`Imported ${data.length} passwords`);
      } catch {
        toast.error('Invalid JSON file');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleDelete = (id: string) => {
    deletePassword(id);
    setDeleteId(null);
    setViewEntry(null);
    toast.success('Password deleted');
  };

  return (
    <div className="p-6 space-y-4 max-w-full">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-white font-bold text-xl">Password Vault</h1>
          <p className="text-dark-400 text-sm mt-0.5">{filtered.length} of {passwords.length} entries</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={clsx(
              'flex items-center gap-2 px-3 py-2 rounded-xl border text-sm transition-colors',
              showFilters ? 'bg-brand-500/20 border-brand-500/30 text-brand-400' : 'border-white/10 text-dark-300 hover:bg-white/5'
            )}
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>
          <button
            onClick={exportPasswords}
            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 text-dark-300 hover:bg-white/5 text-sm transition-colors"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          <label className="flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 text-dark-300 hover:bg-white/5 text-sm transition-colors cursor-pointer">
            <Upload className="w-4 h-4" />
            Import
            <input type="file" accept=".json" onChange={handleImport} className="hidden" />
          </label>
          <button
            onClick={() => setAddOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-400 text-white text-sm font-semibold transition-colors shadow-lg shadow-brand-500/20"
          >
            <Plus className="w-4 h-4" />
            Add New
          </button>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="space-y-3">
        <SearchBar value={search} onChange={handleSearchChange} />
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex flex-wrap gap-2"
            >
              {/* Category filter */}
              <div className="flex flex-wrap gap-1.5">
                {(['All', ...ALL_CATEGORIES] as const).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => handleCategoryChange(cat)}
                    className={clsx(
                      'px-2.5 py-1 rounded-lg text-xs font-medium transition-colors border',
                      selectedCategory === cat
                        ? 'bg-brand-500/20 border-brand-500/30 text-brand-400'
                        : 'border-white/8 text-dark-400 hover:bg-white/5 hover:text-white'
                    )}
                  >
                    {cat !== 'All' && <span className="mr-1">{CATEGORY_ICONS[cat as Category]}</span>}
                    {cat}
                  </button>
                ))}
              </div>

              {/* Strength filter */}
              <div className="flex gap-1.5 ml-auto">
                {(['All', 'strong', 'medium', 'weak'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setSelectedStrength(s)}
                    className={clsx(
                      'px-2.5 py-1 rounded-lg text-xs font-medium transition-colors border capitalize',
                      selectedStrength === s
                        ? 'bg-brand-500/20 border-brand-500/30 text-brand-400'
                        : 'border-white/8 text-dark-400 hover:bg-white/5 hover:text-white'
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-white/8 overflow-hidden bg-dark-900/40">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/8 bg-dark-900/60">
                {[
                  { label: 'Website', field: 'website' as SortField },
                  { label: 'Username / Email', field: 'username' as SortField },
                  { label: 'Password', field: null },
                  { label: 'Category', field: 'category' as SortField },
                  { label: 'Strength', field: 'strength' as SortField },
                  { label: 'Updated', field: 'createdAt' as SortField },
                  { label: 'Actions', field: null },
                ].map(({ label, field }) => (
                  <th
                    key={label}
                    onClick={() => field && handleSort(field)}
                    className={clsx(
                      'px-4 py-3 text-left text-dark-400 text-xs font-semibold uppercase tracking-wider whitespace-nowrap',
                      field && 'cursor-pointer hover:text-white transition-colors'
                    )}
                  >
                    <span className="flex items-center gap-1">
                      {label}
                      {field && <SortIcon field={field} />}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/4">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-dark-400">
                    No passwords found
                  </td>
                </tr>
              ) : (
                filtered.map((pw, i) => {
                  const isRevealed = revealedIds.has(pw.id);
                  return (
                    <motion.tr
                      key={pw.id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.02 }}
                      className="hover:bg-white/3 transition-colors group"
                    >
                      {/* Website */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-dark-800 border border-white/8 flex items-center justify-center flex-shrink-0">
                            <Globe className="w-3.5 h-3.5 text-dark-400" />
                          </div>
                          <div>
                            <p className="text-white font-medium text-sm">{pw.website}</p>
                            {pw.url && (
                              <a href={pw.url} target="_blank" rel="noopener noreferrer" className="text-brand-400/60 text-xs hover:text-brand-400 flex items-center gap-0.5 transition-colors">
                                <ExternalLink className="w-2.5 h-2.5" />
                                Open
                              </a>
                            )}
                          </div>
                          {pw.favorite && <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 flex-shrink-0" />}
                        </div>
                      </td>

                      {/* Username / Email */}
                      <td className="px-4 py-3">
                        <div className="space-y-0.5">
                          {pw.email && (
                            <div className="flex items-center gap-1.5">
                              <span className="text-dark-200 text-xs font-mono truncate max-w-[150px]">{pw.email}</span>
                              <button
                                onClick={() => copy(pw.email, `email-${pw.id}`, 'Email')}
                                className="opacity-0 group-hover:opacity-100 text-dark-500 hover:text-white transition-all"
                              >
                                {copiedId === `email-${pw.id}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                              </button>
                            </div>
                          )}
                          {pw.username && (
                            <div className="flex items-center gap-1.5">
                              <span className="text-dark-400 text-xs font-mono truncate max-w-[150px]">{pw.username}</span>
                              <button
                                onClick={() => copy(pw.username, `user-${pw.id}`, 'Username')}
                                className="opacity-0 group-hover:opacity-100 text-dark-500 hover:text-white transition-all"
                              >
                                {copiedId === `user-${pw.id}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                              </button>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Password */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-dark-200 tracking-widest">
                            {isRevealed ? pw.password : maskPassword(pw.password)}
                          </span>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => toggleReveal(pw.id)}
                              className="p-1 rounded hover:bg-white/10 text-dark-400 hover:text-white transition-colors"
                            >
                              {isRevealed ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                            </button>
                            <button
                              onClick={() => copy(pw.password, `pass-${pw.id}`, 'Password')}
                              className="p-1 rounded hover:bg-white/10 text-dark-400 hover:text-white transition-colors"
                            >
                              {copiedId === `pass-${pw.id}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            </button>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-4 py-3">
                        <span className="text-dark-400 text-xs">
                          {CATEGORY_ICONS[pw.category]} {pw.category}
                        </span>
                      </td>

                      {/* Strength */}
                      <td className="px-4 py-3">
                        <StrengthBadge strength={pw.strength} size="sm" />
                      </td>

                      {/* Date */}
                      <td className="px-4 py-3">
                        <span className="text-dark-500 text-xs whitespace-nowrap">
                          {format(new Date(pw.updatedAt), 'MMM d, yyyy')}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => setViewEntry(pw)}
                            className="p-1.5 rounded-lg hover:bg-white/10 text-dark-400 hover:text-white transition-colors"
                            title="View details"
                          >
                            <MoreHorizontal className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => toggleFavorite(pw.id)}
                            className="p-1.5 rounded-lg hover:bg-amber-500/10 text-dark-400 hover:text-amber-400 transition-colors"
                            title="Toggle favorite"
                          >
                            <Star className={clsx('w-3.5 h-3.5', pw.favorite && 'fill-amber-400 text-amber-400')} />
                          </button>
                          <button
                            onClick={() => setEditEntry(pw)}
                            className="p-1.5 rounded-lg hover:bg-brand-500/10 text-dark-400 hover:text-brand-400 transition-colors"
                            title="Edit"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteId(pw.id)}
                            className="p-1.5 rounded-lg hover:bg-red-500/10 text-dark-400 hover:text-red-400 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Detail Modal */}
      <Modal isOpen={!!viewEntry} onClose={() => setViewEntry(null)} title="Password Details" size="md">
        {viewEntry && (
          <PasswordDetailModal
            entry={viewEntry}
            onClose={() => setViewEntry(null)}
            onEdit={() => { setEditEntry(viewEntry); setViewEntry(null); }}
            onDelete={() => { setDeleteId(viewEntry.id); setViewEntry(null); }}
          />
        )}
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={!!editEntry} onClose={() => setEditEntry(null)} title="Edit Password" size="lg">
        {editEntry && (
          <PasswordForm
            initial={editEntry}
            onSave={(data) => {
              updatePassword(editEntry.id, data);
              setEditEntry(null);
              toast.success('Password updated!');
            }}
            onClose={() => setEditEntry(null)}
          />
        )}
      </Modal>

      {/* Add Modal */}
      <Modal isOpen={addOpen} onClose={() => setAddOpen(false)} title="Add New Password" size="lg">
        <PasswordForm
          onSave={(data) => {
            addPassword(data);
            setAddOpen(false);
            toast.success('Password added!');
          }}
          onClose={() => setAddOpen(false)}
        />
      </Modal>

      {/* Delete Confirm */}
      <Modal isOpen={!!deleteId} onClose={() => setDeleteId(null)} title="Confirm Delete" size="sm">
        <div className="p-6">
          <p className="text-dark-300 text-sm mb-6">Are you sure you want to delete this password? This action cannot be undone.</p>
          <div className="flex gap-3">
            <button onClick={() => setDeleteId(null)} className="flex-1 py-2.5 rounded-xl border border-white/10 text-dark-300 text-sm hover:bg-white/5 transition-colors">
              Cancel
            </button>
            <button
              onClick={() => deleteId && handleDelete(deleteId)}
              className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-400 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
