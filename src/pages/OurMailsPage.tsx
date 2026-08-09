import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail, Eye, EyeOff, Copy, Plus, Pencil, Trash2, Search,
  Shield, AlertCircle, Loader2, X, Save, RefreshCw, ExternalLink,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import type { MailAccount } from '@/types/database.types';
import { emitMobileNotification } from '@/components/MobileNotificationBanner';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

function maskPassword(pw: string): string {
  if (!pw) return '—';
  if (pw.length <= 4) return '•'.repeat(pw.length);
  return pw.slice(0, 2) + '•'.repeat(Math.max(pw.length - 4, 6)) + pw.slice(-2);
}

function useCopy() {
  const copy = (value: string, label = 'Value') =>
    navigator.clipboard.writeText(value).then(() => toast.success(`${label} copied`));
  return { copy };
}

// ─── Mail Form ────────────────────────────────────────────────────────────────

interface MailFormProps {
  initial?: MailAccount | null;
  onClose: () => void;
  onSaved: () => void;
}

function MailForm({ initial, onClose, onSaved }: MailFormProps) {
  const [email, setEmail] = useState(initial?.email ?? '');
  const [password, setPassword] = useState(initial?.password ?? '');
  const [showPw, setShowPw] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!email.trim()) { toast.error('Email is required'); return; }
    if (!password.trim()) { toast.error('Password is required'); return; }
    setSaving(true);
    try {
      if (initial) {
        const { error } = await supabase
          .from('mails')
          .update({ email: email.trim(), password })
          .eq('id', initial.id);
        if (error) throw error;
        toast.success('Mail account updated');
      } else {
        const { error } = await supabase
          .from('mails')
          .insert({ email: email.trim(), password });
        if (error) throw error;
        toast.success('Mail account added');
        emitMobileNotification('📧 Admin Added Company Mail', `Mail account "${email.trim()}" was created.`, 'mail');
      }
      onSaved();
      onClose();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to save');
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
            {initial ? 'Edit Mail Account' : 'Add Mail Account'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-dark-400 hover:text-white hover:bg-white/5 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-dark-300 text-xs font-medium mb-1.5">Email Address *</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. helpswz.team@gmail.com"
              className="w-full px-3 py-2.5 rounded-xl bg-dark-800/80 border border-white/10 text-white text-sm placeholder-dark-500 focus:outline-none focus:border-brand-500/50 transition-all"
            />
          </div>
          <div>
            <label className="block text-dark-300 text-xs font-medium mb-1.5">Password *</label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Account password"
                className="w-full pl-3 pr-10 py-2.5 rounded-xl bg-dark-800/80 border border-white/10 text-white text-sm font-mono placeholder-dark-500 focus:outline-none focus:border-brand-500/50 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 hover:text-white transition-colors"
              >
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 px-6 py-4 border-t border-white/8">
          <button onClick={onClose} className="btn-ghost flex-1">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 justify-center">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving...' : initial ? 'Update' : 'Add Account'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Confirm Delete ───────────────────────────────────────────────────────────

function ConfirmDelete({ email, onConfirm, onCancel }: { email: string; onConfirm: () => void; onCancel: () => void }) {
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
            <p className="text-white font-semibold text-sm">Delete Mail Account</p>
            <p className="text-dark-400 text-xs">This action cannot be undone</p>
          </div>
        </div>
        <p className="text-dark-300 text-sm mb-6">
          Are you sure you want to delete <span className="text-white font-medium">{email}</span>?
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="btn-ghost flex-1">Cancel</button>
          <button onClick={onConfirm} className="px-4 py-2.5 rounded-xl bg-red-500 hover:bg-red-400 text-white text-sm font-semibold flex-1 transition-colors">Delete</button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Mail Card ────────────────────────────────────────────────────────────────

function MailCard({
  mail, isAdmin, onEdit, onDelete,
}: { mail: MailAccount; isAdmin: boolean; onEdit: () => void; onDelete: () => void }) {
  const [visible, setVisible] = useState(false);
  const { copy } = useCopy();

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-dark-900/60 border border-white/8 rounded-2xl p-5 space-y-4 hover:border-white/15 transition-all flex flex-col justify-between group"
    >
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center flex-shrink-0">
              <Mail className="w-4 h-4 text-red-400" />
            </div>
            <div className="min-w-0">
              <p className="text-white font-semibold text-sm truncate">Gmail Account</p>
              <p className="text-dark-400 text-xs">
                Added {format(new Date(mail.created_at), 'dd MMM yyyy')}
              </p>
            </div>
          </div>
          <a
            href="https://mail.google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 text-dark-400 hover:text-white transition-colors flex-shrink-0"
            title="Open Gmail"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>

        {/* Email Row */}
        <div className="p-3 rounded-xl bg-dark-800/60 border border-white/5 flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-dark-500 text-[10px] uppercase font-semibold mb-0.5">Email Address</p>
            <p className="text-white text-xs font-mono truncate">{mail.email}</p>
          </div>
          <button
            onClick={() => copy(mail.email, 'Email')}
            className="p-1.5 rounded-lg text-dark-400 hover:text-white hover:bg-white/5 transition-colors flex-shrink-0"
            title="Copy email"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Password Row */}
        <div className="p-3 rounded-xl bg-dark-800/60 border border-white/5 flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-dark-500 text-[10px] uppercase font-semibold mb-0.5">Password</p>
            <p className="text-white text-xs font-mono">
              {visible ? mail.password : maskPassword(mail.password)}
            </p>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={() => setVisible(!visible)}
              className="p-1.5 rounded-lg text-dark-400 hover:text-white hover:bg-white/5 transition-colors"
              title={visible ? 'Hide' : 'Show'}
              aria-label={visible ? 'Hide password' : 'Show password'}
            >
              {visible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={() => copy(mail.password, 'Password')}
              className="p-1.5 rounded-lg text-dark-400 hover:text-white hover:bg-white/5 transition-colors"
              title="Copy password"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Admin Actions */}
      {isAdmin && (
        <div className="flex items-center justify-end gap-1 pt-3 border-t border-white/5">
          <button onClick={onEdit} className="p-1.5 rounded-lg text-dark-400 hover:text-brand-400 hover:bg-brand-500/10 transition-colors text-xs flex items-center gap-1">
            <Pencil className="w-3.5 h-3.5" /> Edit
          </button>
          <button onClick={onDelete} className="p-1.5 rounded-lg text-dark-400 hover:text-red-400 hover:bg-red-500/10 transition-colors text-xs flex items-center gap-1">
            <Trash2 className="w-3.5 h-3.5" /> Delete
          </button>
        </div>
      )}
    </motion.div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="bg-dark-900/60 border border-white/8 rounded-2xl p-5 space-y-4 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-white/5" />
        <div className="space-y-2 flex-1">
          <div className="h-3 w-1/2 bg-white/5 rounded-lg" />
          <div className="h-2 w-1/3 bg-white/5 rounded-lg" />
        </div>
      </div>
      <div className="h-11 rounded-xl bg-white/5" />
      <div className="h-11 rounded-xl bg-white/5" />
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function OurMailsPage() {
  const { session } = useAuth();
  const isAdmin = session?.role === 'admin' || session?.role === 'root';

  const [mails, setMails] = useState<MailAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<MailAccount | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MailAccount | null>(null);

  const fetchMails = async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from('mails')
      .select('*')
      .order('created_at', { ascending: false });
    if (err) {
      const msg = err.message.includes('schema cache') || err.code === 'PGRST200'
        ? "Table 'mails' not found. Run mails.sql in Supabase."
        : err.message;
      setError(msg);
    } else {
      setMails(data ?? []);
    }
    setLoading(false);
  };

  useEffect(() => { fetchMails(); }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return mails;
    const q = search.toLowerCase();
    return mails.filter((m) => m.email.toLowerCase().includes(q));
  }, [mails, search]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const { error: err } = await supabase.from('mails').delete().eq('id', deleteTarget.id);
    if (err) {
      toast.error('Failed to delete: ' + err.message);
    } else {
      toast.success('Mail account deleted');
      setMails((prev) => prev.filter((m) => m.id !== deleteTarget.id));
    }
    setDeleteTarget(null);
  };

  return (
    <div className="p-3 sm:p-6 space-y-5 max-w-7xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-white font-bold text-xl">Our Company Mails</h1>
          <p className="text-dark-400 text-sm mt-0.5">
            {mails.length} company email account{mails.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchMails} className="p-2 rounded-xl bg-white/5 border border-white/10 text-dark-400 hover:text-white transition-colors" title="Refresh">
            <RefreshCw className="w-4 h-4" />
          </button>
          {isAdmin && (
            <button onClick={() => { setEditTarget(null); setShowForm(true); }} className="btn-primary">
              <Plus className="w-4 h-4" /> Add Mail Account
            </button>
          )}
        </div>
      </motion.div>

      {/* Security Banner */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 }} className="flex items-center gap-3 p-4 rounded-xl bg-brand-500/8 border border-brand-500/20">
        <Shield className="w-5 h-5 text-brand-400 flex-shrink-0" />
        <p className="text-dark-300 text-xs sm:text-sm">
          All mail accounts are secured with Supabase Row Level Security (RLS). Passwords are masked by default.
        </p>
      </motion.div>

      {/* Search */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
        <div className="relative max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
          <input
            type="text"
            placeholder="Search email address..."
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
            <p className="text-red-300 text-sm font-medium">Error loading mails</p>
            <p className="text-red-400/70 text-xs mt-0.5">{error}</p>
            <button onClick={fetchMails} className="text-red-400 text-xs hover:text-red-300 mt-2 underline">Retry</button>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-dark-800 border border-white/8 flex items-center justify-center mb-4">
            <Mail className="w-8 h-8 text-dark-500" />
          </div>
          <p className="text-dark-300 font-medium">
            {search ? 'No mail accounts match search' : 'No mail accounts found'}
          </p>
          {!search && isAdmin && (
            <p className="text-dark-500 text-sm mt-1">Click "Add Mail Account" to get started.</p>
          )}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {filtered.map((mail) => (
            <MailCard
              key={mail.id}
              mail={mail}
              isAdmin={isAdmin}
              onEdit={() => { setEditTarget(mail); setShowForm(true); }}
              onDelete={() => setDeleteTarget(mail)}
            />
          ))}
        </motion.div>
      )}

      {/* Form Modal */}
      <AnimatePresence>
        {showForm && (
          <MailForm
            initial={editTarget}
            onClose={() => setShowForm(false)}
            onSaved={fetchMails}
          />
        )}
      </AnimatePresence>

      {/* Delete Confirm */}
      <AnimatePresence>
        {deleteTarget && (
          <ConfirmDelete
            email={deleteTarget.email}
            onConfirm={handleDelete}
            onCancel={() => setDeleteTarget(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
