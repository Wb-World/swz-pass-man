import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldAlert, Users, Globe, Mail, Key, UserCheck, Plus, Pencil, Trash2,
  AlertCircle, Loader2, RefreshCw, Save, X, Eye, EyeOff, BarChart2,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import type { Profile, MailAccount, ApiKeyRecord, EmpRecord, SiteWithCredentials, SiteCredential } from '@/types/database.types';
import { emitMobileNotification } from '@/components/MobileNotificationBanner';
import toast from 'react-hot-toast';
import clsx from 'clsx';

type AdminTab = 'overview' | 'users' | 'sites' | 'mails' | 'apikeys' | 'employees';

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, color }: { icon: typeof Globe; label: string; value: number | string; color: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-dark-900/60 border border-white/8 rounded-2xl p-5 flex items-center gap-4"
    >
      <div className={clsx('w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0', color)}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-dark-400 text-xs">{label}</p>
        <p className="text-white text-2xl font-bold mt-0.5">{value}</p>
      </div>
    </motion.div>
  );
}

// ─── Generic confirm delete dialog ───────────────────────────────────────────

function ConfirmDeleteModal({ label, onConfirm, onCancel }: { label: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-sm bg-dark-900 border border-white/10 rounded-2xl p-6 shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <AlertCircle className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <p className="text-white font-semibold text-sm">Confirm Delete</p>
            <p className="text-dark-400 text-xs">This action cannot be undone</p>
          </div>
        </div>
        <p className="text-dark-300 text-sm mb-6">Delete <span className="text-white font-medium">{label}</span>?</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="btn-ghost flex-1">Cancel</button>
          <button onClick={onConfirm} className="px-4 py-2.5 rounded-xl bg-red-500 hover:bg-red-400 text-white text-sm font-semibold flex-1 transition-colors">Delete</button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Quick Form Field ─────────────────────────────────────────────────────────

function Field({ label, value, onChange, placeholder, type = 'text' }: {
  label: string; value: string; onChange: (v: string) => void; placeholder: string; type?: string;
}) {
  const [show, setShow] = useState(false);
  if (type === 'password') {
    return (
      <div>
        <label className="block text-dark-300 text-xs font-medium mb-1.5">{label}</label>
        <div className="relative">
          <input
            type={show ? 'text' : 'password'}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full pl-3 pr-9 py-2.5 rounded-xl bg-dark-800/80 border border-white/10 text-white text-sm font-mono placeholder-dark-500 focus:outline-none focus:border-brand-500/50"
          />
          <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 hover:text-white">
            {show ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    );
  }
  return (
    <div>
      <label className="block text-dark-300 text-xs font-medium mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2.5 rounded-xl bg-dark-800/80 border border-white/10 text-white text-sm placeholder-dark-500 focus:outline-none focus:border-brand-500/50"
      />
    </div>
  );
}

// ─── Users Tab ────────────────────────────────────────────────────────────────

function UsersTab({ currentUserId }: { currentUserId?: string }) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const fetch = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    if (error) toast.error('Failed to load profiles');
    else setProfiles(data ?? []);
    setLoading(false);
  };
  useEffect(() => { fetch(); }, []);

  const changeRole = async (id: string, role: 'root' | 'admin' | 'viewer' | 'user') => {
    setUpdating(id);
    const { error } = await supabase.from('profiles').update({ role } as any).eq('id', id);
    if (error) toast.error('Failed to update role');
    else {
      toast.success('Role updated');
      setProfiles((prev) => prev.map((p) => p.id === id ? { ...p, role } : p));
    }
    setUpdating(null);
  };

  return (
    <div className="bg-dark-900/60 border border-white/8 rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
        <div>
          <h3 className="text-white font-semibold text-sm">Registered Users &amp; Roles</h3>
          <p className="text-dark-400 text-xs mt-0.5">Manage authorization across the system</p>
        </div>
        <button onClick={fetch} className="p-2 rounded-xl bg-white/5 border border-white/10 text-dark-400 hover:text-white transition-colors">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>
      {loading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 text-brand-400 animate-spin" /></div>
      ) : profiles.length === 0 ? (
        <p className="text-dark-400 text-sm italic py-10 text-center">No user profiles found</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/8 text-dark-400 text-xs font-semibold">
                <th className="py-3 px-5">User ID</th>
                <th className="py-3 px-5">Role</th>
                <th className="py-3 px-5">Joined</th>
                <th className="py-3 px-5 text-right">Change Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-xs text-dark-200">
              {profiles.map((p) => (
                <tr key={p.id} className="hover:bg-white/2 transition-colors">
                  <td className="py-3 px-5 font-mono text-dark-300 max-w-[180px] truncate">{p.id}</td>
                  <td className="py-3 px-5">
                    <span className={clsx('px-2 py-0.5 rounded-full text-[10px] font-semibold border',
                      p.role === 'root' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                      p.role === 'admin' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                      'bg-blue-500/10 text-blue-400 border-blue-500/20'
                    )}>{p.role}</span>
                  </td>
                  <td className="py-3 px-5 text-dark-400">{new Date(p.created_at).toLocaleDateString()}</td>
                  <td className="py-3 px-5 text-right">
                    <select
                      value={p.role}
                      disabled={updating === p.id || p.id === currentUserId}
                      onChange={(e) => changeRole(p.id, e.target.value as any)}
                      className="px-2 py-1 rounded-lg bg-dark-800 border border-white/10 text-white text-xs focus:outline-none disabled:opacity-50"
                    >
                      <option value="viewer">Viewer</option>
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                      <option value="root">Root</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Sites Tab ────────────────────────────────────────────────────────────────

function SitesAdminTab() {
  const [sites, setSites] = useState<SiteWithCredentials[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editSite, setEditSite] = useState<SiteWithCredentials | null>(null);
  const [deleteSite, setDeleteSite] = useState<SiteWithCredentials | null>(null);
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [desc, setDesc] = useState('');
  const [saving, setSaving] = useState(false);

  const fetch = async () => {
    setLoading(true);
    const [sr, cr] = await Promise.all([
      supabase.from('sites').select('*').order('name'),
      supabase.from('site_credentials').select('*'),
    ]);
    if (!sr.error) {
      const creds = (cr.data as SiteCredential[]) ?? [];
      setSites((sr.data ?? []).map((s: any) => ({ ...s, credentials: creds.filter((c) => c.site_id === s.id) })));
    }
    setLoading(false);
  };
  useEffect(() => { fetch(); }, []);

  const openForm = (site?: SiteWithCredentials) => {
    setEditSite(site ?? null);
    setName(site?.name ?? '');
    setUrl(site?.url ?? '');
    setDesc(site?.description ?? '');
    setShowForm(true);
  };

  const save = async () => {
    if (!name.trim()) { toast.error('Site name required'); return; }
    setSaving(true);
    try {
      if (editSite) {
        const { error } = await supabase.from('sites').update({ name: name.trim(), url: url.trim(), description: desc.trim() } as any).eq('id', editSite.id);
        if (error) throw error;
        toast.success('Site updated');
      } else {
        const { error } = await supabase.from('sites').insert({ name: name.trim(), url: url.trim(), description: desc.trim() } as any);
        if (error) throw error;
        toast.success('Site added');
        emitMobileNotification('🔔 Admin Added Site', `Site "${name.trim()}" was added to company sites.`, 'site');
      }
      setShowForm(false);
      fetch();
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to save site');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteSite) return;
    const { error } = await supabase.from('sites').delete().eq('id', deleteSite.id);
    if (error) toast.error(error.message);
    else { toast.success('Site deleted'); fetch(); }
    setDeleteSite(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-semibold text-sm">Sites Management</h3>
        <button onClick={() => openForm()} className="btn-primary text-xs">
          <Plus className="w-3.5 h-3.5" /> Add Site
        </button>
      </div>
      {loading ? <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-brand-400" /></div> : (
        <div className="overflow-x-auto bg-dark-900/60 border border-white/8 rounded-2xl">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/8 text-dark-400 font-semibold">
                <th className="py-3 px-5">Name</th>
                <th className="py-3 px-5">URL</th>
                <th className="py-3 px-5">Credentials</th>
                <th className="py-3 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {sites.map((s) => (
                <tr key={s.id} className="hover:bg-white/2 transition-colors">
                  <td className="py-3 px-5 text-white font-medium">{s.name}</td>
                  <td className="py-3 px-5 text-dark-300 max-w-[200px] truncate">{s.url || '—'}</td>
                  <td className="py-3 px-5 text-dark-400">{s.credentials.length}</td>
                  <td className="py-3 px-5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openForm(s)} className="p-1.5 rounded-lg text-dark-400 hover:text-brand-400 hover:bg-brand-500/10 transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => setDeleteSite(s)} className="p-1.5 rounded-lg text-dark-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {sites.length === 0 && <tr><td colSpan={4} className="py-10 text-center text-dark-400">No sites found</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-md bg-dark-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
                <h2 className="text-white font-semibold text-sm">{editSite ? 'Edit Site' : 'Add Site'}</h2>
                <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg text-dark-400 hover:text-white hover:bg-white/5"><X className="w-4 h-4" /></button>
              </div>
              <div className="p-6 space-y-4">
                <Field label="Site Name *" value={name} onChange={setName} placeholder="e.g. CyberJai" />
                <Field label="Website URL" value={url} onChange={setUrl} placeholder="https://example.com" />
                <Field label="Description" value={desc} onChange={setDesc} placeholder="A short description" />
              </div>
              <div className="flex gap-3 px-6 py-4 border-t border-white/8">
                <button onClick={() => setShowForm(false)} className="btn-ghost flex-1">Cancel</button>
                <button onClick={save} disabled={saving} className="btn-primary flex-1 justify-center">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {saving ? 'Saving...' : editSite ? 'Update' : 'Add Site'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
        {deleteSite && <ConfirmDeleteModal label={deleteSite.name} onConfirm={handleDelete} onCancel={() => setDeleteSite(null)} />}
      </AnimatePresence>
    </div>
  );
}

// ─── Mails Tab ────────────────────────────────────────────────────────────────

function MailsAdminTab() {
  const [mails, setMails] = useState<MailAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editMail, setEditMail] = useState<MailAccount | null>(null);
  const [deleteMail, setDeleteMail] = useState<MailAccount | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);

  const fetch = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('mails').select('*').order('created_at', { ascending: false });
    if (!error) setMails(data ?? []);
    setLoading(false);
  };
  useEffect(() => { fetch(); }, []);

  const openForm = (m?: MailAccount) => {
    setEditMail(m ?? null);
    setEmail(m?.email ?? '');
    setPassword(m?.password ?? '');
    setShowForm(true);
  };

  const save = async () => {
    if (!email.trim() || !password.trim()) { toast.error('Email and password required'); return; }
    setSaving(true);
    try {
      if (editMail) {
        const { error } = await supabase.from('mails').update({ email: email.trim(), password }).eq('id', editMail.id);
        if (error) throw error;
        toast.success('Mail updated');
      } else {
        const { error } = await supabase.from('mails').insert({ email: email.trim(), password });
        if (error) throw error;
        toast.success('Mail added');
        emitMobileNotification('📧 Admin Added Company Mail', `Mail account "${email.trim()}" was created.`, 'mail');
      }
      setShowForm(false); fetch();
    } catch (err: any) { toast.error(err?.message ?? 'Failed'); } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteMail) return;
    const { error } = await supabase.from('mails').delete().eq('id', deleteMail.id);
    if (error) toast.error(error.message);
    else { toast.success('Deleted'); fetch(); }
    setDeleteMail(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-semibold text-sm">Mail Accounts</h3>
        <button onClick={() => openForm()} className="btn-primary text-xs"><Plus className="w-3.5 h-3.5" /> Add Mail</button>
      </div>
      {loading ? <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-brand-400" /></div> : (
        <div className="overflow-x-auto bg-dark-900/60 border border-white/8 rounded-2xl">
          <table className="w-full text-left text-xs">
            <thead><tr className="border-b border-white/8 text-dark-400 font-semibold">
              <th className="py-3 px-5">Email</th><th className="py-3 px-5">Added</th><th className="py-3 px-5 text-right">Actions</th>
            </tr></thead>
            <tbody className="divide-y divide-white/5">
              {mails.map((m) => (
                <tr key={m.id} className="hover:bg-white/2 transition-colors">
                  <td className="py-3 px-5 text-white font-medium">{m.email}</td>
                  <td className="py-3 px-5 text-dark-400">{new Date(m.created_at).toLocaleDateString()}</td>
                  <td className="py-3 px-5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openForm(m)} className="p-1.5 rounded-lg text-dark-400 hover:text-brand-400 hover:bg-brand-500/10"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => setDeleteMail(m)} className="p-1.5 rounded-lg text-dark-400 hover:text-red-400 hover:bg-red-500/10"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {mails.length === 0 && <tr><td colSpan={3} className="py-10 text-center text-dark-400">No mail accounts found</td></tr>}
            </tbody>
          </table>
        </div>
      )}
      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-md bg-dark-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
                <h2 className="text-white font-semibold text-sm">{editMail ? 'Edit Mail' : 'Add Mail'}</h2>
                <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg text-dark-400 hover:text-white hover:bg-white/5"><X className="w-4 h-4" /></button>
              </div>
              <div className="p-6 space-y-4">
                <Field label="Email *" value={email} onChange={setEmail} placeholder="helpswz.team@gmail.com" type="email" />
                <Field label="Password *" value={password} onChange={setPassword} placeholder="Account password" type="password" />
              </div>
              <div className="flex gap-3 px-6 py-4 border-t border-white/8">
                <button onClick={() => setShowForm(false)} className="btn-ghost flex-1">Cancel</button>
                <button onClick={save} disabled={saving} className="btn-primary flex-1 justify-center">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {saving ? 'Saving...' : editMail ? 'Update' : 'Add'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
        {deleteMail && <ConfirmDeleteModal label={deleteMail.email} onConfirm={handleDelete} onCancel={() => setDeleteMail(null)} />}
      </AnimatePresence>
    </div>
  );
}

// ─── API Keys Tab ─────────────────────────────────────────────────────────────

function ApiKeysAdminTab() {
  const [keys, setKeys] = useState<ApiKeyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editKey, setEditKey] = useState<ApiKeyRecord | null>(null);
  const [deleteKey, setDeleteKey] = useState<ApiKeyRecord | null>(null);
  const [name, setName] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [saving, setSaving] = useState(false);

  const fetch = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('api_keys').select('*').order('created_at', { ascending: false });
    if (!error) setKeys(data ?? []);
    setLoading(false);
  };
  useEffect(() => { fetch(); }, []);

  const openForm = (k?: ApiKeyRecord) => {
    setEditKey(k ?? null);
    setName(k?.name ?? '');
    setApiKey(k?.api_key ?? '');
    setShowForm(true);
  };

  const save = async () => {
    if (!name.trim() || !apiKey.trim()) { toast.error('Name and API key required'); return; }
    setSaving(true);
    try {
      if (editKey) {
        const { error } = await supabase.from('api_keys').update({ name: name.trim(), api_key: apiKey.trim() }).eq('id', editKey.id);
        if (error) throw error;
        toast.success('API Key updated');
      } else {
        const { error } = await supabase.from('api_keys').insert({ name: name.trim(), api_key: apiKey.trim() });
        if (error) throw error;
        toast.success('API Key added');
        emitMobileNotification('🔑 Admin Added API Key', `API Key "${name.trim()}" was created.`, 'apikey');
      }
      setShowForm(false); fetch();
    } catch (err: any) { toast.error(err?.message ?? 'Failed'); } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteKey) return;
    const { error } = await supabase.from('api_keys').delete().eq('id', deleteKey.id);
    if (error) toast.error(error.message);
    else { toast.success('Deleted'); fetch(); }
    setDeleteKey(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-semibold text-sm">API Keys Management</h3>
        <button onClick={() => openForm()} className="btn-primary text-xs"><Plus className="w-3.5 h-3.5" /> Add Key</button>
      </div>
      {loading ? <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-brand-400" /></div> : (
        <div className="overflow-x-auto bg-dark-900/60 border border-white/8 rounded-2xl">
          <table className="w-full text-left text-xs">
            <thead><tr className="border-b border-white/8 text-dark-400 font-semibold">
              <th className="py-3 px-5">Name</th><th className="py-3 px-5">Key Preview</th><th className="py-3 px-5">Added</th><th className="py-3 px-5 text-right">Actions</th>
            </tr></thead>
            <tbody className="divide-y divide-white/5">
              {keys.map((k) => (
                <tr key={k.id} className="hover:bg-white/2 transition-colors">
                  <td className="py-3 px-5 text-white font-medium">{k.name}</td>
                  <td className="py-3 px-5 text-dark-400 font-mono">{k.api_key.slice(0, 12)}•••</td>
                  <td className="py-3 px-5 text-dark-400">{new Date(k.created_at).toLocaleDateString()}</td>
                  <td className="py-3 px-5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openForm(k)} className="p-1.5 rounded-lg text-dark-400 hover:text-brand-400 hover:bg-brand-500/10"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => setDeleteKey(k)} className="p-1.5 rounded-lg text-dark-400 hover:text-red-400 hover:bg-red-500/10"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {keys.length === 0 && <tr><td colSpan={4} className="py-10 text-center text-dark-400">No API keys found</td></tr>}
            </tbody>
          </table>
        </div>
      )}
      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-md bg-dark-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
                <h2 className="text-white font-semibold text-sm">{editKey ? 'Edit API Key' : 'Add API Key'}</h2>
                <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg text-dark-400 hover:text-white hover:bg-white/5"><X className="w-4 h-4" /></button>
              </div>
              <div className="p-6 space-y-4">
                <Field label="Name / Label *" value={name} onChange={setName} placeholder="e.g. Zeroupi" />
                <Field label="API Key *" value={apiKey} onChange={setApiKey} placeholder="Paste key here" type="password" />
              </div>
              <div className="flex gap-3 px-6 py-4 border-t border-white/8">
                <button onClick={() => setShowForm(false)} className="btn-ghost flex-1">Cancel</button>
                <button onClick={save} disabled={saving} className="btn-primary flex-1 justify-center">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {saving ? 'Saving...' : editKey ? 'Update' : 'Add'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
        {deleteKey && <ConfirmDeleteModal label={deleteKey.name} onConfirm={handleDelete} onCancel={() => setDeleteKey(null)} />}
      </AnimatePresence>
    </div>
  );
}

// ─── Employees Tab ────────────────────────────────────────────────────────────

function EmployeesAdminTab() {
  const [emps, setEmps] = useState<EmpRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editEmp, setEditEmp] = useState<EmpRecord | null>(null);
  const [deleteEmp, setDeleteEmp] = useState<EmpRecord | null>(null);
  const [name, setName] = useState('');
  const [mail, setMail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('');
  const [saving, setSaving] = useState(false);

  const fetch = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('emp').select('*').order('name');
    if (!error) setEmps(data ?? []);
    setLoading(false);
  };
  useEffect(() => { fetch(); }, []);

  const openForm = (e?: EmpRecord) => {
    setEditEmp(e ?? null);
    setName(e?.name ?? '');
    setMail(e?.mail ?? '');
    setPhone(e?.phone_number ?? '');
    setRole(e?.role ?? '');
    setShowForm(true);
  };

  const save = async () => {
    if (!name.trim() || !mail.trim()) { toast.error('Name and email required'); return; }
    setSaving(true);
    try {
      const payload = { name: name.trim(), mail: mail.trim(), phone_number: phone.trim() || 'MT', role: role.trim() || 'MT', avatar: 'MT', offer_letter: 'MT' };
      if (editEmp) {
        const { error } = await supabase.from('emp').update(payload).eq('name', editEmp.name).eq('mail', editEmp.mail);
        if (error) throw error;
        toast.success('Employee updated');
      } else {
        const { error } = await supabase.from('emp').insert(payload);
        if (error) throw error;
        toast.success('Employee added');
        emitMobileNotification('👥 Admin Added Employee', `Team member "${name.trim()}" was registered.`, 'employee');
      }
      setShowForm(false); fetch();
    } catch (err: any) { toast.error(err?.message ?? 'Failed'); } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteEmp) return;
    const { error } = await supabase.from('emp').delete().eq('name', deleteEmp.name).eq('mail', deleteEmp.mail);
    if (error) toast.error(error.message);
    else { toast.success('Employee removed'); fetch(); }
    setDeleteEmp(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-semibold text-sm">Employees Management</h3>
        <button onClick={() => openForm()} className="btn-primary text-xs"><Plus className="w-3.5 h-3.5" /> Add Employee</button>
      </div>
      {loading ? <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-brand-400" /></div> : (
        <div className="overflow-x-auto bg-dark-900/60 border border-white/8 rounded-2xl">
          <table className="w-full text-left text-xs">
            <thead><tr className="border-b border-white/8 text-dark-400 font-semibold">
              <th className="py-3 px-5">Name</th><th className="py-3 px-5">Email</th><th className="py-3 px-5">Role</th><th className="py-3 px-5 text-right">Actions</th>
            </tr></thead>
            <tbody className="divide-y divide-white/5">
              {emps.map((e, i) => (
                <tr key={`${e.name}-${e.mail}-${i}`} className="hover:bg-white/2 transition-colors">
                  <td className="py-3 px-5 text-white font-medium">{e.name}</td>
                  <td className="py-3 px-5 text-dark-300">{e.mail}</td>
                  <td className="py-3 px-5 text-dark-400">{e.role !== 'MT' ? e.role : '—'}</td>
                  <td className="py-3 px-5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openForm(e)} className="p-1.5 rounded-lg text-dark-400 hover:text-brand-400 hover:bg-brand-500/10"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => setDeleteEmp(e)} className="p-1.5 rounded-lg text-dark-400 hover:text-red-400 hover:bg-red-500/10"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {emps.length === 0 && <tr><td colSpan={4} className="py-10 text-center text-dark-400">No employees found</td></tr>}
            </tbody>
          </table>
        </div>
      )}
      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-md bg-dark-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
                <h2 className="text-white font-semibold text-sm">{editEmp ? 'Edit Employee' : 'Add Employee'}</h2>
                <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg text-dark-400 hover:text-white hover:bg-white/5"><X className="w-4 h-4" /></button>
              </div>
              <div className="p-6 grid sm:grid-cols-2 gap-4">
                <Field label="Full Name *" value={name} onChange={setName} placeholder="e.g. Rishima S" />
                <Field label="Role" value={role} onChange={setRole} placeholder="e.g. Developer" />
                <Field label="Email *" value={mail} onChange={setMail} placeholder="emp@example.com" type="email" />
                <Field label="Phone" value={phone} onChange={setPhone} placeholder="+91 XXXXX" />
              </div>
              <div className="flex gap-3 px-6 py-4 border-t border-white/8">
                <button onClick={() => setShowForm(false)} className="btn-ghost flex-1">Cancel</button>
                <button onClick={save} disabled={saving} className="btn-primary flex-1 justify-center">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {saving ? 'Saving...' : editEmp ? 'Update' : 'Add'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
        {deleteEmp && <ConfirmDeleteModal label={deleteEmp.name} onConfirm={handleDelete} onCancel={() => setDeleteEmp(null)} />}
      </AnimatePresence>
    </div>
  );
}

// ─── Main Admin Page ──────────────────────────────────────────────────────────

export function AdminPage() {
  const { session } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [stats, setStats] = useState({ sites: 0, mails: 0, apikeys: 0, employees: 0 });
  const [statsLoading, setStatsLoading] = useState(true);

  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    const [sr, mr, ar, er] = await Promise.all([
      supabase.from('sites').select('id', { count: 'exact', head: true }),
      supabase.from('mails').select('id', { count: 'exact', head: true }),
      supabase.from('api_keys').select('id', { count: 'exact', head: true }),
      supabase.from('emp').select('name', { count: 'exact', head: true }),
    ]);
    setStats({
      sites: sr.count ?? 0,
      mails: mr.count ?? 0,
      apikeys: ar.count ?? 0,
      employees: er.count ?? 0,
    });
    setStatsLoading(false);
  }, []);

  useEffect(() => { loadStats(); }, [loadStats]);

  const tabs: { id: AdminTab; label: string; icon: typeof Globe }[] = [
    { id: 'overview',   label: 'Overview',   icon: BarChart2   },
    { id: 'users',      label: 'Users',       icon: UserCheck  },
    { id: 'sites',      label: 'Sites',       icon: Globe      },
    { id: 'mails',      label: 'Mails',       icon: Mail       },
    { id: 'apikeys',    label: 'API Keys',    icon: Key        },
    { id: 'employees',  label: 'Employees',   icon: Users      },
  ];

  return (
    <div className="p-3 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <ShieldAlert className="w-6 h-6 text-red-400" />
          </div>
          <div>
            <h1 className="text-white font-bold text-xl flex items-center gap-2">
              Admin System Panel
              <span className="px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-semibold bg-red-500/20 text-red-400 border border-red-500/30">
                {session?.role}
              </span>
            </h1>
            <p className="text-dark-400 text-xs sm:text-sm mt-0.5">
              Centralized management for users, data, and system configuration
            </p>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex items-center gap-1.5 border-b border-white/8 overflow-x-auto pb-1 scrollbar-hide">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={clsx(
              'flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap',
              activeTab === id
                ? 'bg-red-500/15 text-red-400 border border-red-500/20'
                : 'text-dark-400 hover:text-white hover:bg-white/5'
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.2 }}>
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard icon={Globe}  label="Total Sites"     value={statsLoading ? '…' : stats.sites}     color="bg-brand-500/10 border border-brand-500/20 text-brand-400" />
                <StatCard icon={Mail}   label="Gmail Accounts"  value={statsLoading ? '…' : stats.mails}     color="bg-red-500/10 border border-red-500/20 text-red-400" />
                <StatCard icon={Key}    label="API Keys"        value={statsLoading ? '…' : stats.apikeys}   color="bg-amber-500/10 border border-amber-500/20 text-amber-400" />
                <StatCard icon={Users}  label="Employees"       value={statsLoading ? '…' : stats.employees} color="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400" />
              </div>
              <div className="p-6 rounded-2xl bg-dark-900/60 border border-white/8 text-center space-y-2">
                <p className="text-dark-300 text-sm">Select a tab above to manage specific data.</p>
                <p className="text-dark-500 text-xs">Full CRUD is available for Sites, Mails, API Keys, and Employees.</p>
              </div>
            </div>
          )}
          {activeTab === 'users'     && <UsersTab currentUserId={session?.userId} />}
          {activeTab === 'sites'     && <SitesAdminTab />}
          {activeTab === 'mails'     && <MailsAdminTab />}
          {activeTab === 'apikeys'   && <ApiKeysAdminTab />}
          {activeTab === 'employees' && <EmployeesAdminTab />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
