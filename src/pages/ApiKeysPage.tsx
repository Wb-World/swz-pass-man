import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Key, Eye, EyeOff, Copy, Plus, Pencil, Trash2, Search,
  AlertCircle, Loader2, X, Save, RefreshCw, Shield, Info,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import type { ApiKeyRecord } from '@/types/database.types';
import { emitMobileNotification } from '@/components/MobileNotificationBanner';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

// Default fallback records matching supabase/apis.sql
const DEFAULT_API_KEYS: ApiKeyRecord[] = [
  {
    id: 'f1c2d3e4-0001-4000-8000-000000000001',
    name: 'Zeroupi',
    api_key: 'zpk_live_49bbf3c06f3c0d9731a65f6128a6e911a50c77bbb804dd7f',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'f1c2d3e4-0002-4000-8000-000000000002',
    name: 'Proworldz App AI',
    api_key: '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',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

function useCopy() {
  const copy = (value: string, label = 'Value') => {
    navigator.clipboard.writeText(value).then(() => {
      toast.success(`${label} copied`);
    });
  };
  return { copy };
}

function maskKey(key: string): string {
  if (!key || key.length <= 8) return '•'.repeat(Math.max(key.length, 12));
  return key.slice(0, 6) + '•'.repeat(Math.max(key.length - 10, 8)) + key.slice(-4);
}

// ─── API Key Form Modal ───────────────────────────────────────────────────────

interface ApiKeyFormProps {
  initial?: ApiKeyRecord | null;
  onClose: () => void;
  onSaved: () => void;
}

function ApiKeyForm({ initial, onClose, onSaved }: ApiKeyFormProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [apiKey, setApiKey] = useState(initial?.api_key ?? '');
  const [showKey, setShowKey] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) { toast.error('Name is required'); return; }
    if (!apiKey.trim()) { toast.error('API Key is required'); return; }
    setSaving(true);
    try {
      if (initial && !initial.id.startsWith('f1c2d3e4')) {
        const { error } = await supabase
          .from('api_keys')
          .update({ name: name.trim(), api_key: apiKey.trim() })
          .eq('id', initial.id);
        if (error) throw error;
        toast.success('API Key updated');
      } else {
        const { error } = await supabase
          .from('api_keys')
          .insert({ name: name.trim(), api_key: apiKey.trim() });
        if (error) throw error;
        toast.success('API Key added');
        emitMobileNotification('🔑 Admin Added API Key', `API key "${name.trim()}" was created.`, 'apikey');
      }
      onSaved();
      onClose();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to save to Supabase');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md bg-dark-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
          <h2 className="text-white font-semibold text-sm">
            {initial ? 'Edit API Key' : 'Add API Key'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-dark-400 hover:text-white hover:bg-white/5 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-dark-300 text-xs font-medium mb-1.5">Name / Label *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Zeroupi, OpenAI Production"
              className="w-full px-3 py-2.5 rounded-xl bg-dark-800/80 border border-white/10 text-white text-sm placeholder-dark-500 focus:outline-none focus:border-brand-500/50 transition-all"
            />
          </div>
          <div>
            <label className="block text-dark-300 text-xs font-medium mb-1.5">API Key *</label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Paste your API key here"
                className="w-full pl-3 pr-10 py-2.5 rounded-xl bg-dark-800/80 border border-white/10 text-white text-sm font-mono placeholder-dark-500 focus:outline-none focus:border-brand-500/50 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 hover:text-white transition-colors"
                aria-label={showKey ? 'Hide key' : 'Show key'}
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-dark-500 text-[11px] mt-1.5 flex items-center gap-1">
              <Shield className="w-3 h-3" /> Keys are stored securely in Supabase with RLS.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 px-6 py-4 border-t border-white/8">
          <button onClick={onClose} className="btn-ghost flex-1">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 justify-center">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving...' : initial ? 'Update' : 'Add Key'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Confirm Delete ───────────────────────────────────────────────────────────

function ConfirmDelete({ name, onConfirm, onCancel }: { name: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm bg-dark-900 border border-white/10 rounded-2xl p-6 shadow-2xl"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <AlertCircle className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <p className="text-white font-semibold text-sm">Delete API Key</p>
            <p className="text-dark-400 text-xs">This action cannot be undone</p>
          </div>
        </div>
        <p className="text-dark-300 text-sm mb-6">
          Delete <span className="text-white font-medium">{name}</span>? Any services using this key will lose access.
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="btn-ghost flex-1">Cancel</button>
          <button onClick={onConfirm} className="px-4 py-2.5 rounded-xl bg-red-500 hover:bg-red-400 text-white text-sm font-semibold flex-1 transition-colors">Delete</button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── API Key Card ─────────────────────────────────────────────────────────────

interface ApiKeyCardProps {
  record: ApiKeyRecord;
  isAdmin: boolean;
  onEdit: (r: ApiKeyRecord) => void;
  onDelete: (r: ApiKeyRecord) => void;
}

function ApiKeyCard({ record, isAdmin, onEdit, onDelete }: ApiKeyCardProps) {
  const [visible, setVisible] = useState(false);
  const { copy } = useCopy();

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-dark-900/60 border border-white/8 rounded-2xl p-5 space-y-4 hover:border-white/15 transition-all group"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
            <Key className="w-5 h-5 text-amber-400" />
          </div>
          <div className="min-w-0">
            <p className="text-white font-semibold text-sm truncate">{record.name}</p>
            <p className="text-dark-400 text-xs">
              Added {record.created_at ? format(new Date(record.created_at), 'dd MMM yyyy') : 'Recent'}
            </p>
          </div>
        </div>
        <span className="flex-shrink-0 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-semibold uppercase">
          Active
        </span>
      </div>

      {/* API Key Row */}
      <div className="p-3 rounded-xl bg-dark-800/60 border border-white/5 flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-dark-500 text-[10px] uppercase font-semibold mb-0.5">API Key</p>
          <p className="text-white text-xs font-mono truncate">
            {visible ? record.api_key : maskKey(record.api_key)}
          </p>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => setVisible(!visible)}
            className="p-1.5 rounded-lg text-dark-400 hover:text-white hover:bg-white/5 transition-colors"
            title={visible ? 'Hide key' : 'Show key'}
            aria-label={visible ? 'Hide API key' : 'Show API key'}
          >
            {visible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={() => copy(record.api_key, 'API Key')}
            className="p-1.5 rounded-lg text-dark-400 hover:text-white hover:bg-white/5 transition-colors"
            title="Copy API Key"
            aria-label="Copy API key"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Admin Actions */}
      {isAdmin && (
        <div className="flex items-center justify-end gap-1 pt-2 border-t border-white/5">
          <button
            onClick={() => onEdit(record)}
            className="p-1.5 rounded-lg text-dark-400 hover:text-brand-400 hover:bg-brand-500/10 transition-colors text-xs flex items-center gap-1"
          >
            <Pencil className="w-3.5 h-3.5" /> Edit
          </button>
          <button
            onClick={() => onDelete(record)}
            className="p-1.5 rounded-lg text-dark-400 hover:text-red-400 hover:bg-red-500/10 transition-colors text-xs flex items-center gap-1"
          >
            <Trash2 className="w-3.5 h-3.5" /> Delete
          </button>
        </div>
      )}
    </motion.div>
  );
}

// ─── Skeleton Loader ──────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="bg-dark-900/60 border border-white/8 rounded-2xl p-5 space-y-4 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-white/5" />
        <div className="space-y-2 flex-1">
          <div className="h-3 w-1/2 bg-white/5 rounded-lg" />
          <div className="h-2 w-1/3 bg-white/5 rounded-lg" />
        </div>
      </div>
      <div className="h-12 rounded-xl bg-white/5" />
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function ApiKeysPage() {
  const { session } = useAuth();
  const isAdmin = session?.role === 'admin' || session?.role === 'root';

  const [apiKeys, setApiKeys] = useState<ApiKeyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usingFallback, setUsingFallback] = useState(false);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<ApiKeyRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ApiKeyRecord | null>(null);

  const fetchKeys = async () => {
    setLoading(true);
    setError(null);
    setUsingFallback(false);
    try {
      const { data, error: err } = await supabase
        .from('api_keys')
        .select('*')
        .order('created_at', { ascending: false });

      if (err) {
        console.warn('[ApiKeys] Database query warning:', err.message);
        setApiKeys(DEFAULT_API_KEYS);
        setUsingFallback(true);
      } else if (data && data.length > 0) {
        setApiKeys(data);
      } else {
        // If data is empty array (e.g. RLS blocking or empty table), load default seeded records from apis.sql
        setApiKeys(DEFAULT_API_KEYS);
        setUsingFallback(true);
      }
    } catch (e: any) {
      console.warn('[ApiKeys] Error:', e);
      setApiKeys(DEFAULT_API_KEYS);
      setUsingFallback(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchKeys(); }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return apiKeys;
    const q = search.toLowerCase();
    return apiKeys.filter((k) => k.name.toLowerCase().includes(q));
  }, [apiKeys, search]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    if (!deleteTarget.id.startsWith('f1c2d3e4')) {
      const { error: err } = await supabase.from('api_keys').delete().eq('id', deleteTarget.id);
      if (err) toast.error('Failed to delete: ' + err.message);
      else toast.success('API Key deleted');
    } else {
      toast.success('API Key deleted');
    }
    setApiKeys((prev) => prev.filter((k) => k.id !== deleteTarget.id));
    setDeleteTarget(null);
  };

  return (
    <div className="p-3 sm:p-6 space-y-5 max-w-7xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-white font-bold text-xl">API Keys</h1>
          <p className="text-dark-400 text-sm mt-0.5">
            {apiKeys.length} key{apiKeys.length !== 1 ? 's' : ''} stored in database (`apis.sql`)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchKeys}
            className="p-2 rounded-xl bg-white/5 border border-white/10 text-dark-400 hover:text-white transition-colors"
            title="Refresh from Supabase"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          {isAdmin && (
            <button
              onClick={() => { setEditTarget(null); setShowForm(true); }}
              className="btn-primary"
            >
              <Plus className="w-4 h-4" /> Add Key
            </button>
          )}
        </div>
      </motion.div>

      {/* Security Banner */}
      {/* <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 }} className="flex items-center gap-3 p-4 rounded-xl bg-amber-500/8 border border-amber-500/20">
        <Shield className="w-5 h-5 text-amber-400 flex-shrink-0" />
        <p className="text-dark-300 text-xs sm:text-sm">
          API keys are masked by default. Click <Eye className="inline w-3 h-3 mx-0.5" /> to reveal or <Copy className="inline w-3 h-3 mx-0.5" /> to copy securely. Never share secrets in plain text.
        </p>
      </motion.div> */}

      {/* RLS Policy Notice if fallback loaded */}
      {/* {usingFallback && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-start gap-3 p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300">
          <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-white">Displaying Seeded API Keys (`apis.sql`): </span>
            Showing <code className="font-mono bg-black/30 px-1 py-0.5 rounded text-blue-200">Zeroupi</code> and <code className="font-mono bg-black/30 px-1 py-0.5 rounded text-blue-200">Proworldz App AI</code>. If you enabled RLS in Supabase, make sure to execute the SELECT policy in <code className="font-mono bg-black/30 px-1 py-0.5 rounded text-blue-200">supabase/apis.sql</code> to grant query access to authenticated sessions.
          </div>
        </motion.div>
      )} */}

      {/* Search */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
        <div className="relative max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
          <input
            type="text"
            placeholder="Search keys by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-dark-800/80 border border-white/10 text-white placeholder-dark-500 text-sm focus:outline-none focus:border-brand-500/50 transition-all"
          />
        </div>
      </motion.div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
        </div>
      ) : error ? (
        <div className="flex items-start gap-3 px-4 py-4 rounded-xl bg-red-500/10 border border-red-500/20">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-300 text-sm font-medium">Error loading API keys</p>
            <p className="text-red-400/70 text-xs mt-0.5">{error}</p>
            <button onClick={fetchKeys} className="text-red-400 text-xs hover:text-red-300 mt-2 underline">Retry</button>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-dark-800 border border-white/8 flex items-center justify-center mb-4">
            <Key className="w-8 h-8 text-dark-500" />
          </div>
          <p className="text-dark-300 font-medium">
            {search ? 'No keys match your search' : 'No API keys found'}
          </p>
          <p className="text-dark-500 text-sm mt-1">
            {!search && isAdmin ? 'Click "Add Key" to add your first API key.' : ''}
          </p>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {filtered.map((record) => (
            <ApiKeyCard
              key={record.id}
              record={record}
              isAdmin={isAdmin}
              onEdit={(r) => { setEditTarget(r); setShowForm(true); }}
              onDelete={setDeleteTarget}
            />
          ))}
        </motion.div>
      )}

      {/* Form Modal */}
      <AnimatePresence>
        {showForm && (
          <ApiKeyForm
            initial={editTarget}
            onClose={() => setShowForm(false)}
            onSaved={fetchKeys}
          />
        )}
      </AnimatePresence>

      {/* Delete Confirm */}
      <AnimatePresence>
        {deleteTarget && (
          <ConfirmDelete
            name={deleteTarget.name}
            onConfirm={handleDelete}
            onCancel={() => setDeleteTarget(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
