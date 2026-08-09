import { useEffect, useState, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle, Copy, ExternalLink, Eye, EyeOff, Globe, Loader2,
  Pencil, Plus, RefreshCw, Save, ShieldCheck, Trash2, UserCheck,
  Search, X, Lock, Info,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useClipboard } from '@/hooks/useClipboard';
import { maskPassword } from '@/utils/passwordUtils';
import type { SiteRow, SiteGroup } from '@/types/database.types';
import { emitMobileNotification } from '@/components/MobileNotificationBanner';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import { format } from 'date-fns';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MT = 'MT'; // sentinel for "Missing / empty" value from the SQL schema

function isSet(v: string | undefined | null): boolean {
  return !!v && v.trim() !== '' && v.trim() !== MT && v.trim().toLowerCase() !== 'null';
}

/** Group flat site rows by (name, url) to form cards */
function groupSiteRows(rows: SiteRow[]): SiteGroup[] {
  const map = new Map<string, SiteGroup>();
  for (const row of rows) {
    const key = `${row.name}||${row.url}`;
    if (!map.has(key)) {
      map.set(key, { name: row.name, url: row.url, description: row.description, rows: [] });
    }
    map.get(key)!.rows.push(row);
  }
  return Array.from(map.values());
}

// ─── Copy hook wrapper ────────────────────────────────────────────────────────

function useCopy() {
  const { copy } = useClipboard();
  const copyField = (value: string, label: string) => {
    if (isSet(value)) copy(value, label);
  };
  return { copyField };
}

// ─── CredentialBlock ──────────────────────────────────────────────────────────

function CredentialBlock({ row }: { row: SiteRow }) {
  const [showPassword, setShowPassword] = useState(false);
  const { copyField } = useCopy();
  const isAdmin = row.cred_type === 'admin';

  const hasUsername   = isSet(row.username);
  const hasEmail      = isSet(row.email);
  const hasPassword   = isSet(row.password);
  const hasAdminUrl   = isAdmin && isSet(row.admin_page_url);
  const hasNotes      = isSet(row.notes);

  return (
    <div className={clsx(
      'rounded-xl border p-4 space-y-2.5',
      isAdmin
        ? 'bg-purple-500/5 border-purple-500/25'
        : 'bg-emerald-500/5 border-emerald-500/25',
    )}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isAdmin
            ? <ShieldCheck className="w-4 h-4 text-purple-400 flex-shrink-0" />
            : <UserCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />}
          <p className="text-white text-sm font-semibold">
            {isAdmin ? 'Admin Login' : 'Login Credential'}
          </p>
        </div>
        <span className={clsx(
          'text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border',
          isAdmin
            ? 'bg-purple-500/10 border-purple-500/25 text-purple-300'
            : 'bg-emerald-500/10 border-emerald-500/25 text-emerald-300',
        )}>
          {row.cred_type}
        </span>
      </div>

      {/* Credential Fields */}
      <div className="space-y-1.5 text-xs">
        {/* Username */}
        {hasUsername && (
          <CredRow
            label="Username"
            value={row.username}
            onCopy={() => copyField(row.username, 'Username')}
          />
        )}

        {/* Email */}
        {hasEmail && (
          <CredRow
            label="Email"
            value={row.email}
            onCopy={() => copyField(row.email, 'Email')}
          />
        )}

        {/* If neither username nor email, say no identity */}
        {!hasUsername && !hasEmail && (
          <div className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-black/10 text-dark-500 italic">
            No username / email stored
          </div>
        )}

        {/* Password */}
        {hasPassword ? (
          <div className="flex items-center justify-between gap-3 rounded-lg bg-black/10 px-2.5 py-2">
            <span className="text-dark-400">Password</span>
            <div className="flex min-w-0 items-center gap-1.5">
              <span className="truncate font-mono text-white">
                {showPassword ? row.password : maskPassword(row.password)}
              </span>
              <button
                onClick={() => setShowPassword((v) => !v)}
                className="p-1 text-dark-400 hover:text-white transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={() => copyField(row.password, 'Password')}
                className="p-1 text-dark-400 hover:text-white transition-colors"
                aria-label="Copy password"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-black/10 text-dark-500 italic">
            No password stored
          </div>
        )}

        {/* Admin page URL */}
        {hasAdminUrl && (
          <div className="flex items-center justify-between gap-3 rounded-lg bg-black/10 px-2.5 py-2">
            <span className="text-dark-400">Admin page</span>
            <a
              href={row.admin_page_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-purple-400 hover:text-purple-300 truncate"
            >
              <span className="truncate">Open link</span>
              <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
            </a>
          </div>
        )}

        {/* Notes */}
        {hasNotes && (
          <p className="pt-2 border-t border-white/5 text-dark-400 italic">{row.notes}</p>
        )}
      </div>
    </div>
  );
}

function CredRow({ label, value, onCopy }: { label: string; value: string; onCopy: () => void }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg bg-black/10 px-2.5 py-2">
      <span className="text-dark-400 flex-shrink-0">{label}</span>
      <div className="flex min-w-0 items-center gap-1">
        <span className="truncate text-white font-mono">{value}</span>
        <button onClick={onCopy} className="p-1 text-dark-400 hover:text-white transition-colors flex-shrink-0" aria-label={`Copy ${label}`}>
          <Copy className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

// ─── Site Detail Modal ────────────────────────────────────────────────────────

function SiteDetailModal({
  group,
  isAdmin,
  onClose,
  onEditRow,
  onDeleteRow,
  onAddRow,
}: {
  group: SiteGroup;
  isAdmin: boolean;
  onClose: () => void;
  onEditRow: (row: SiteRow) => void;
  onDeleteRow: (row: SiteRow) => void;
  onAddRow: () => void;
}) {
  const normalRows = group.rows.filter((r) => r.cred_type === 'normal');
  const adminRows  = group.rows.filter((r) => r.cred_type === 'admin');

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onMouseDown={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 8 }}
        onMouseDown={(e) => e.stopPropagation()}
        className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-dark-900 shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-white/10 px-6 py-5">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center flex-shrink-0">
              <Globe className="w-5 h-5 text-brand-400" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-white truncate">{group.name}</h2>
              {isSet(group.description) && (
                <p className="text-sm text-dark-400 mt-0.5 truncate">{group.description}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            {isAdmin && (
              <button
                onClick={onAddRow}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-500/10 text-brand-400 border border-brand-500/20 text-xs font-semibold hover:bg-brand-500/20 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Add credential
              </button>
            )}
            <button onClick={onClose} className="rounded-lg p-2 text-dark-400 hover:bg-white/5 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Website link */}
          {isSet(group.url) && (
            <div className="flex items-center justify-between gap-3 rounded-xl bg-dark-800/60 border border-white/8 px-4 py-3">
              <span className="text-dark-400 text-xs">Website</span>
              <a
                href={group.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-brand-400 hover:text-brand-300 text-sm transition-colors"
              >
                <span className="truncate max-w-xs">{group.url}</span>
                <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
              </a>
            </div>
          )}

          {/* Counts summary */}
          <div className="flex items-center gap-3 text-xs text-dark-400">
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
              <UserCheck className="w-3.5 h-3.5" /> {normalRows.length} login{normalRows.length !== 1 ? 's' : ''}
            </span>
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300">
              <ShieldCheck className="w-3.5 h-3.5" /> {adminRows.length} admin{adminRows.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Normal credentials */}
          {normalRows.length > 0 && (
            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-emerald-400" /> Login Credentials
              </h3>
              <div className="grid gap-3 md:grid-cols-2">
                {normalRows.map((row) => (
                  <div key={row.id} className="relative">
                    <CredentialBlock row={row} />
                    {isAdmin && (
                      <div className="absolute top-2 right-2 flex gap-1">
                        <button
                          onClick={() => onEditRow(row)}
                          className="p-1.5 rounded-lg bg-dark-900/80 text-dark-400 hover:text-brand-400 hover:bg-brand-500/10 transition-colors"
                          title="Edit credential"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => onDeleteRow(row)}
                          className="p-1.5 rounded-lg bg-dark-900/80 text-dark-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          title="Delete credential"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Admin credentials */}
          {adminRows.length > 0 && (
            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-purple-400" /> Admin Credentials
              </h3>
              <div className="grid gap-3 md:grid-cols-2">
                {adminRows.map((row) => (
                  <div key={row.id} className="relative">
                    <CredentialBlock row={row} />
                    {isAdmin && (
                      <div className="absolute top-2 right-2 flex gap-1">
                        <button
                          onClick={() => onEditRow(row)}
                          className="p-1.5 rounded-lg bg-dark-900/80 text-dark-400 hover:text-brand-400 hover:bg-brand-500/10 transition-colors"
                          title="Edit credential"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => onDeleteRow(row)}
                          className="p-1.5 rounded-lg bg-dark-900/80 text-dark-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          title="Delete credential"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {group.rows.length === 0 && (
            <div className="rounded-xl border border-dashed border-white/10 p-8 text-center text-sm text-dark-500">
              No credentials stored for this site.
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// ─── Row Form Modal ───────────────────────────────────────────────────────────

interface RowFormProps {
  /** Pre-fills name/url/description when adding a new credential to an existing site group */
  prefillSiteGroup?: SiteGroup;
  /** Existing row to edit */
  existingRow?: SiteRow | null;
  onSave: () => void;
  onClose: () => void;
}

function RowForm({ prefillSiteGroup, existingRow, onSave, onClose }: RowFormProps) {
  const [name, setName]               = useState(existingRow?.name ?? prefillSiteGroup?.name ?? '');
  const [url, setUrl]                 = useState(existingRow?.url ?? prefillSiteGroup?.url ?? '');
  const [description, setDescription] = useState(existingRow?.description ?? prefillSiteGroup?.description ?? '');
  const [credType, setCredType]       = useState<'normal' | 'admin'>(existingRow?.cred_type ?? 'normal');
  const [username, setUsername]       = useState(existingRow ? (isSet(existingRow.username) ? existingRow.username : '') : '');
  const [email, setEmail]             = useState(existingRow ? (isSet(existingRow.email) ? existingRow.email : '') : '');
  const [password, setPassword]       = useState(existingRow ? (isSet(existingRow.password) ? existingRow.password : '') : '');
  const [adminUrl, setAdminUrl]       = useState(existingRow ? (isSet(existingRow.admin_page_url) ? existingRow.admin_page_url : '') : '');
  const [notes, setNotes]             = useState(existingRow ? (isSet(existingRow.notes) ? existingRow.notes : '') : '');
  const [showPw, setShowPw]           = useState(false);
  const [saving, setSaving]           = useState(false);

  const save = async () => {
    if (!name.trim()) { toast.error('Site name is required'); return; }
    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        url: url.trim() || MT,
        description: description.trim() || MT,
        cred_type: credType,
        username: username.trim() || MT,
        email: email.trim() || MT,
        password: password || MT,
        admin_page_url: adminUrl.trim() || MT,
        notes: notes.trim() || MT,
      };

      if (existingRow) {
        const { error } = await supabase.from('sites').update(payload as any).eq('id', existingRow.id);
        if (error) throw error;
        toast.success('Credential updated');
      } else {
        const { error } = await supabase.from('sites').insert(payload as any);
        if (error) throw error;
        toast.success('Credential added');
        emitMobileNotification('🔔 Admin Added Site Credential', `New credential added for "${name.trim()}".`, 'site');
      }
      onSave();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const isAddingToExistingSite = !!prefillSiteGroup && !existingRow;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-dark-900 shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <h2 className="font-semibold text-white text-sm">
            {existingRow ? 'Edit Credential' : isAddingToExistingSite ? `Add Credential — ${prefillSiteGroup?.name}` : 'Add Site + Credential'}
          </h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-dark-400 hover:bg-white/5 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Site info — hide when adding to existing site group */}
          {!isAddingToExistingSite && (
            <div className="grid gap-3 sm:grid-cols-2">
              <FormField label="Site name *" value={name} onChange={setName} placeholder="e.g. CyberJai" />
              <FormField label="Website URL" value={url} onChange={setUrl} placeholder="https://example.com" />
              <div className="sm:col-span-2">
                <FormField label="Description" value={description} onChange={setDescription} placeholder="A short description of this site" />
              </div>
            </div>
          )}

          <div className="border-t border-white/8 pt-4 space-y-4">
            {/* Credential type toggle */}
            <div>
              <label className="block text-xs text-dark-300 mb-1.5">Credential Type</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setCredType('normal')}
                  className={clsx(
                    'flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all',
                    credType === 'normal'
                      ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                      : 'bg-dark-800 border-white/10 text-dark-400 hover:text-white',
                  )}
                >
                  <UserCheck className="w-4 h-4" /> Login Credential
                </button>
                <button
                  type="button"
                  onClick={() => setCredType('admin')}
                  className={clsx(
                    'flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all',
                    credType === 'admin'
                      ? 'bg-purple-500/15 border-purple-500/30 text-purple-300'
                      : 'bg-dark-800 border-white/10 text-dark-400 hover:text-white',
                  )}
                >
                  <ShieldCheck className="w-4 h-4" /> Admin Login
                </button>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <FormField label="Username" value={username} onChange={setUsername} placeholder="Username or login ID" />
              <FormField label="Email" value={email} onChange={setEmail} placeholder="Email address" />
              <div>
                <label className="block text-xs text-dark-300 mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Account password"
                    className="w-full pl-3 pr-9 py-2.5 rounded-xl border border-white/10 bg-dark-800 text-sm text-white font-mono placeholder-dark-500 focus:border-brand-500/50 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 hover:text-white"
                  >
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              {credType === 'admin' && (
                <FormField label="Admin page URL" value={adminUrl} onChange={setAdminUrl} placeholder="https://example.com/admin" />
              )}
              <div className={credType === 'admin' ? '' : 'sm:col-span-2'}>
                <FormField label="Notes" value={notes} onChange={setNotes} placeholder="Optional note (e.g. 'Role: root')" />
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3 border-t border-white/10 px-6 py-4">
          <button onClick={onClose} className="btn-ghost flex-1 justify-center">Cancel</button>
          <button onClick={save} disabled={saving} className="btn-primary flex-1 justify-center">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving...' : existingRow ? 'Update' : 'Add'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function FormField({ label, value, onChange, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; placeholder: string;
}) {
  return (
    <label className="block text-xs text-dark-300">
      {label}
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1.5 w-full rounded-xl border border-white/10 bg-dark-800 px-3 py-2.5 text-sm text-white placeholder-dark-500 focus:border-brand-500/50 focus:outline-none"
      />
    </label>
  );
}

// ─── Site Card ────────────────────────────────────────────────────────────────

function SiteCard({
  group,
  isAdmin,
  onClick,
  onDeleteGroup,
}: {
  group: SiteGroup;
  isAdmin: boolean;
  onClick: () => void;
  onDeleteGroup: () => void;
}) {
  const normalCount = group.rows.filter((r) => r.cred_type === 'normal').length;
  const adminCount  = group.rows.filter((r) => r.cred_type === 'admin').length;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <div
        role="button"
        tabIndex={0}
        onClick={onClick}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } }}
        className="group h-full w-full cursor-pointer rounded-2xl border border-white/8 bg-dark-900/60 p-5 text-left transition-all hover:-translate-y-0.5 hover:border-brand-500/40 hover:bg-dark-900 focus:outline-none focus:ring-2 focus:ring-brand-500/60"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center flex-shrink-0">
              <Globe className="w-5 h-5 text-brand-400" />
            </div>
            <div className="min-w-0">
              <h2 className="font-bold text-white truncate">{group.name}</h2>
              <p className="text-xs text-dark-400 truncate mt-0.5">
                {isSet(group.description) ? group.description : isSet(group.url) ? group.url : 'No description'}
              </p>
            </div>
          </div>
          {isAdmin && (
            <span
              onClick={(e) => e.stopPropagation()}
              className="flex flex-shrink-0 gap-0.5"
            >
              <button
                onClick={onDeleteGroup}
                className="rounded-lg p-1.5 text-dark-400 hover:bg-red-500/10 hover:text-red-400 transition-colors"
                aria-label={`Delete ${group.name}`}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </span>
          )}
        </div>

        {/* Preview badges */}
        <div className="mt-4 flex items-center gap-2 flex-wrap">
          {normalCount > 0 && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[10px] font-semibold">
              <UserCheck className="w-3 h-3" />
              {normalCount} login{normalCount !== 1 ? 's' : ''}
            </span>
          )}
          {adminCount > 0 && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-[10px] font-semibold">
              <ShieldCheck className="w-3 h-3" />
              {adminCount} admin{adminCount !== 1 ? 's' : ''}
            </span>
          )}
          {group.rows.length === 0 && (
            <span className="text-dark-500 text-xs italic">No credentials</span>
          )}
        </div>

        {/* Footer */}
        <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-3 text-xs">
          <span className="flex items-center gap-1 text-dark-500">
            <Lock className="w-3 h-3" />
            {group.rows.length} stored
          </span>
          <span className="font-medium text-brand-400 group-hover:text-brand-300 transition-colors">
            View details →
          </span>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-white/8 bg-dark-900/60 p-5 space-y-4 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-white/5 flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-3.5 w-1/2 bg-white/5 rounded-lg" />
          <div className="h-2.5 w-3/4 bg-white/5 rounded-lg" />
        </div>
      </div>
      <div className="flex gap-2">
        <div className="h-5 w-20 bg-white/5 rounded-full" />
        <div className="h-5 w-16 bg-white/5 rounded-full" />
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function SitesPage() {
  const { session } = useAuth();
  const isAdmin = session?.role === 'admin' || session?.role === 'root';

  const [rows, setRows]           = useState<SiteRow[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [search, setSearch]       = useState('');

  // Modal state
  const [selectedGroup, setSelectedGroup]   = useState<SiteGroup | null>(null);
  const [editRow, setEditRow]               = useState<SiteRow | null>(null);
  const [deleteTarget, setDeleteTarget]     = useState<{ label: string; ids: string[] } | null>(null);
  const [showAddForm, setShowAddForm]       = useState(false);
  const [addToGroup, setAddToGroup]         = useState<SiteGroup | null>(null);

  const fetchSites = async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from('sites')
      .select('*')
      .order('name');

    if (err) {
      setError(err.code === 'PGRST200'
        ? "Table 'sites' not found — run sites_schema.sql in Supabase."
        : err.message);
    } else {
      setRows((data as SiteRow[]) ?? []);
    }
    setLoading(false);
  };

  useEffect(() => { void fetchSites(); }, []);

  const groups = useMemo(() => groupSiteRows(rows), [rows]);

  const filteredGroups = useMemo(() => {
    if (!search.trim()) return groups;
    const q = search.toLowerCase();
    return groups.filter((g) =>
      g.name.toLowerCase().includes(q) ||
      g.url.toLowerCase().includes(q) ||
      g.description.toLowerCase().includes(q) ||
      g.rows.some((r) =>
        (isSet(r.username) && r.username.toLowerCase().includes(q)) ||
        (isSet(r.email) && r.email.toLowerCase().includes(q)) ||
        (isSet(r.notes) && r.notes.toLowerCase().includes(q))
      )
    );
  }, [groups, search]);

  /** Delete all rows for a group */
  const deleteGroup = async () => {
    if (!deleteTarget) return;
    const { error: err } = await supabase
      .from('sites')
      .delete()
      .in('id', deleteTarget.ids);
    if (err) toast.error(err.message);
    else { toast.success(`${deleteTarget.label} deleted`); setSelectedGroup(null); }
    setDeleteTarget(null);
    await fetchSites();
  };

  /** Delete a single credential row */
  const deleteRow = async (row: SiteRow) => {
    const { error: err } = await supabase.from('sites').delete().eq('id', row.id);
    if (err) toast.error(err.message);
    else { toast.success('Credential deleted'); }
    setSelectedGroup(null);
    await fetchSites();
  };

  return (
    <div className="mx-auto max-w-7xl space-y-5 p-3 sm:p-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white">Company Sites</h1>
          <p className="mt-0.5 text-sm text-dark-400">
            {groups.length} site{groups.length !== 1 ? 's' : ''} · {rows.length} credential{rows.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchSites}
            className="p-2 rounded-xl bg-white/5 border border-white/10 text-dark-400 hover:text-white transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          {isAdmin && (
            <button
              onClick={() => { setAddToGroup(null); setShowAddForm(true); }}
              className="btn-primary"
            >
              <Plus className="w-4 h-4" /> Add Site
            </button>
          )}
        </div>
      </motion.div>

      {/* Info Banner */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 }} className="flex items-start gap-3 p-4 rounded-xl bg-brand-500/8 border border-brand-500/20">
        <Info className="w-4 h-4 text-brand-400 flex-shrink-0 mt-0.5" />
        <p className="text-dark-300 text-xs sm:text-sm">
          Each site card shows all its <span className="text-emerald-300 font-medium">login</span> and <span className="text-purple-300 font-medium">admin</span> credentials stored in the database. Click any card to view and copy credentials.
        </p>
      </motion.div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search sites, usernames, emails..."
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-white/10 bg-dark-800/80 text-sm text-white placeholder-dark-500 focus:border-brand-500/50 focus:outline-none"
        />
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => <SkeletonCard key={i} />)}
        </div>
      ) : error ? (
        <div className="flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      ) : filteredGroups.length === 0 ? (
        <div className="py-20 text-center text-dark-400">
          {search ? 'No sites match your search.' : 'No sites have been added yet.'}
        </div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredGroups.map((group) => (
            <SiteCard
              key={`${group.name}||${group.url}`}
              group={group}
              isAdmin={isAdmin}
              onClick={() => setSelectedGroup(group)}
              onDeleteGroup={() => setDeleteTarget({ label: group.name, ids: group.rows.map((r) => r.id) })}
            />
          ))}
        </motion.div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {/* Detail modal */}
        {selectedGroup && !editRow && (
          <SiteDetailModal
            group={selectedGroup}
            isAdmin={isAdmin}
            onClose={() => setSelectedGroup(null)}
            onEditRow={(row) => setEditRow(row)}
            onDeleteRow={async (row) => { await deleteRow(row); }}
            onAddRow={() => { setAddToGroup(selectedGroup); setShowAddForm(true); setSelectedGroup(null); }}
          />
        )}

        {/* Add/Edit form modal */}
        {(showAddForm || editRow) && (
          <RowForm
            prefillSiteGroup={addToGroup ?? undefined}
            existingRow={editRow}
            onClose={() => { setShowAddForm(false); setEditRow(null); setAddToGroup(null); }}
            onSave={async () => {
              setShowAddForm(false);
              setEditRow(null);
              setAddToGroup(null);
              await fetchSites();
            }}
          />
        )}

        {/* Delete confirm */}
        {deleteTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-sm rounded-2xl border border-white/10 bg-dark-900 p-6 shadow-2xl"
            >
              <div className="mb-4 flex items-center gap-3">
                <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-2.5">
                  <AlertCircle className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <p className="font-semibold text-white">Delete site</p>
                  <p className="text-xs text-dark-400">This will delete ALL credentials for this site.</p>
                </div>
              </div>
              <p className="mb-6 text-sm text-dark-300">
                Delete <span className="font-medium text-white">{deleteTarget.label}</span> and its {deleteTarget.ids.length} credential row{deleteTarget.ids.length !== 1 ? 's' : ''}?
              </p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteTarget(null)} className="btn-ghost flex-1 justify-center">Cancel</button>
                <button onClick={deleteGroup} className="flex-1 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-400 transition-colors">
                  Delete all
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
