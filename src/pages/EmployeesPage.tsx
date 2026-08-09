import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Plus, Pencil, Trash2,
  AlertCircle, Loader2, X, Save, Phone, Mail as MailIcon, User, RefreshCw, Search,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import type { EmpRecord } from '@/types/database.types';
import { emitMobileNotification } from '@/components/MobileNotificationBanner';
import toast from 'react-hot-toast';
import clsx from 'clsx';

// ─── Employee Form Modal ──────────────────────────────────────────────────────

interface EmployeeFormProps {
  employee?: EmpRecord | null;
  onSave: () => void;
  onClose: () => void;
}

function EmployeeForm({ employee, onSave, onClose }: EmployeeFormProps) {
  const [name, setName]     = useState(employee?.name ?? '');
  const [mail, setMail]     = useState(employee?.mail ?? '');
  const [phone, setPhone]   = useState(employee?.phone_number ?? '');
  const [role, setRole]     = useState(employee?.role ?? '');
  const [avatar, setAvatar] = useState(employee?.avatar ?? '');
  const [offer, setOffer]   = useState(employee?.offer_letter ?? '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) { toast.error('Name is required'); return; }
    if (!mail.trim()) { toast.error('Email is required'); return; }
    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        mail: mail.trim(),
        phone_number: phone.trim() || 'MT',
        role: role.trim() || 'MT',
        avatar: avatar.trim() || 'MT',
        offer_letter: offer.trim() || 'MT',
      };

      if (employee) {
        const { error } = await supabase
          .from('emp')
          .update(payload)
          .eq('name', employee.name)
          .eq('mail', employee.mail);
        if (error) throw error;
        toast.success('Employee updated');
      } else {
        const { error } = await supabase.from('emp').insert(payload);
        if (error) throw error;
        toast.success('Employee added');
        emitMobileNotification('👥 Admin Added Employee', `Team member "${name.trim()}" was registered.`, 'employee');
      }
      onSave();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Operation failed');
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
        className="w-full max-w-lg bg-dark-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
          <h2 className="text-white font-semibold text-sm">
            {employee ? 'Edit Employee' : 'Add Employee'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-dark-400 hover:text-white hover:bg-white/5 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-dark-300 text-xs font-medium mb-1.5">Full Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Rishima S"
                className="w-full px-3 py-2.5 rounded-xl bg-dark-800/80 border border-white/10 text-white text-sm placeholder-dark-500 focus:outline-none focus:border-brand-500/50 transition-all"
              />
            </div>
            <div>
              <label className="block text-dark-300 text-xs font-medium mb-1.5">Role / Position</label>
              <input
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="e.g. Developer"
                className="w-full px-3 py-2.5 rounded-xl bg-dark-800/80 border border-white/10 text-white text-sm placeholder-dark-500 focus:outline-none focus:border-brand-500/50 transition-all"
              />
            </div>
            <div>
              <label className="block text-dark-300 text-xs font-medium mb-1.5">Email *</label>
              <input
                type="email"
                value={mail}
                onChange={(e) => setMail(e.target.value)}
                placeholder="employee@example.com"
                className="w-full px-3 py-2.5 rounded-xl bg-dark-800/80 border border-white/10 text-white text-sm placeholder-dark-500 focus:outline-none focus:border-brand-500/50 transition-all"
              />
            </div>
            <div>
              <label className="block text-dark-300 text-xs font-medium mb-1.5">Phone Number</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 XXXXX XXXXX"
                className="w-full px-3 py-2.5 rounded-xl bg-dark-800/80 border border-white/10 text-white text-sm placeholder-dark-500 focus:outline-none focus:border-brand-500/50 transition-all"
              />
            </div>
          </div>
          <div>
            <label className="block text-dark-300 text-xs font-medium mb-1.5">Avatar URL / Initials</label>
            <input
              type="text"
              value={avatar}
              onChange={(e) => setAvatar(e.target.value)}
              placeholder="https://... or initials like RS"
              className="w-full px-3 py-2.5 rounded-xl bg-dark-800/80 border border-white/10 text-white text-sm placeholder-dark-500 focus:outline-none focus:border-brand-500/50 transition-all"
            />
          </div>
          <div>
            <label className="block text-dark-300 text-xs font-medium mb-1.5">Offer Letter (URL or reference)</label>
            <input
              type="text"
              value={offer}
              onChange={(e) => setOffer(e.target.value)}
              placeholder="https://... or file reference"
              className="w-full px-3 py-2.5 rounded-xl bg-dark-800/80 border border-white/10 text-white text-sm placeholder-dark-500 focus:outline-none focus:border-brand-500/50 transition-all"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 px-6 py-4 border-t border-white/8">
          <button onClick={onClose} className="btn-ghost flex-1">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 justify-center">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving...' : employee ? 'Update' : 'Add Employee'}
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
            <p className="text-white font-semibold text-sm">Delete Employee</p>
            <p className="text-dark-400 text-xs">This action cannot be undone</p>
          </div>
        </div>
        <p className="text-dark-300 text-sm mb-6">
          Are you sure you want to remove <span className="text-white font-medium">{name}</span> from the team?
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="btn-ghost flex-1">Cancel</button>
          <button onClick={onConfirm} className="px-4 py-2.5 rounded-xl bg-red-500 hover:bg-red-400 text-white text-sm font-semibold flex-1 transition-colors">Remove</button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Employee Card ────────────────────────────────────────────────────────────

function EmployeeCard({
  emp, isAdmin, onEdit, onDelete,
}: { emp: EmpRecord; isAdmin: boolean; onEdit: () => void; onDelete: () => void }) {
  const initials = emp.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
  const isUrl = emp.avatar.startsWith('http');

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-dark-900/60 border border-white/8 rounded-2xl p-5 flex flex-col gap-4 hover:border-white/15 transition-all group"
    >
      {/* Avatar + Name */}
      <div className="flex items-center gap-3">
        <div className="w-14 h-14 rounded-xl overflow-hidden bg-brand-500/10 border border-brand-500/20 flex-shrink-0 flex items-center justify-center">
          {isUrl ? (
            <img src={emp.avatar} alt={emp.name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-brand-400 font-bold text-lg">{initials || <User className="w-6 h-6" />}</span>
          )}
        </div>
        <div className="min-w-0">
          <p className="text-white font-semibold text-sm truncate">{emp.name}</p>
          {emp.role && emp.role !== 'MT' && (
            <span className="mt-1 inline-block px-2 py-0.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-[10px] font-semibold truncate max-w-full">
              {emp.role}
            </span>
          )}
        </div>
      </div>

      {/* Info rows */}
      <div className="space-y-2">
        {emp.mail && (
          <div className="flex items-center gap-2 text-xs text-dark-300">
            <MailIcon className="w-3.5 h-3.5 text-dark-500 flex-shrink-0" />
            <span className="truncate">{emp.mail}</span>
          </div>
        )}
        {emp.phone_number && emp.phone_number !== 'MT' && (
          <div className="flex items-center gap-2 text-xs text-dark-300">
            <Phone className="w-3.5 h-3.5 text-dark-500 flex-shrink-0" />
            <span className="truncate">{emp.phone_number}</span>
          </div>
        )}
        {emp.offer_letter && emp.offer_letter !== 'MT' && (
          <a
            href={emp.offer_letter.startsWith('http') ? emp.offer_letter : '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-xs text-brand-400 hover:text-brand-300 transition-colors"
          >
            <span className="truncate">View Offer Letter</span>
          </a>
        )}
      </div>

      {/* Admin Actions */}
      {isAdmin && (
        <div className="flex items-center gap-2 mt-auto pt-3 border-t border-white/5">
          <button
            onClick={onEdit}
            className="flex-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-dark-400 hover:text-brand-400 hover:bg-brand-500/10 transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" /> Edit
          </button>
          <button
            onClick={onDelete}
            className="flex-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-dark-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" /> Remove
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
        <div className="w-14 h-14 rounded-xl bg-white/5" />
        <div className="space-y-2 flex-1">
          <div className="h-3.5 w-2/3 bg-white/5 rounded-lg" />
          <div className="h-2.5 w-1/3 bg-white/5 rounded-full" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3 bg-white/5 rounded-lg" />
        <div className="h-3 w-3/4 bg-white/5 rounded-lg" />
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function EmployeesPage() {
  const { session } = useAuth();
  const isAdmin = session?.role === 'admin' || session?.role === 'root';

  const [employees, setEmployees] = useState<EmpRecord[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [search, setSearch]       = useState('');
  const [showForm, setShowForm]   = useState(false);
  const [editTarget, setEditTarget] = useState<EmpRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<EmpRecord | null>(null);

  const fetchEmployees = async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from('emp')
      .select('*')
      .order('name');
    if (err) {
      const msg = err.message.includes('schema cache') || err.code === 'PGRST200'
        ? "Table 'emp' not found. Run emp.sql in Supabase."
        : err.message;
      setError(msg);
    } else {
      setEmployees(data ?? []);
    }
    setLoading(false);
  };

  useEffect(() => { fetchEmployees(); }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return employees;
    const q = search.toLowerCase();
    return employees.filter(
      (e) => e.name.toLowerCase().includes(q) || e.mail.toLowerCase().includes(q) || (e.role !== 'MT' && e.role.toLowerCase().includes(q))
    );
  }, [employees, search]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const { error: err } = await supabase
      .from('emp')
      .delete()
      .eq('name', deleteTarget.name)
      .eq('mail', deleteTarget.mail);
    if (err) {
      toast.error('Failed to remove employee');
    } else {
      toast.success('Employee removed');
      setEmployees((prev) => prev.filter((e) => !(e.name === deleteTarget.name && e.mail === deleteTarget.mail)));
    }
    setDeleteTarget(null);
  };

  return (
    <div className="p-3 sm:p-6 space-y-5 max-w-7xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-white font-bold text-xl">Employees</h1>
          <p className="text-dark-400 text-sm mt-0.5">
            {employees.length} team member{employees.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchEmployees} className="p-2 rounded-xl bg-white/5 border border-white/10 text-dark-400 hover:text-white transition-colors" title="Refresh">
            <RefreshCw className="w-4 h-4" />
          </button>
          {isAdmin && (
            <button onClick={() => { setEditTarget(null); setShowForm(true); }} className="btn-primary">
              <Plus className="w-4 h-4" /> Add Employee
            </button>
          )}
        </div>
      </motion.div>

      {/* Search */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
        <div className="relative max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
          <input
            type="text"
            placeholder="Search by name, email, or role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-dark-800/80 border border-white/10 text-white placeholder-dark-500 text-sm focus:outline-none focus:border-brand-500/50 transition-all"
          />
        </div>
      </motion.div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}
        </div>
      ) : error ? (
        <div className="flex items-start gap-3 px-4 py-4 rounded-xl bg-red-500/10 border border-red-500/20">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-300 text-sm font-medium">Error loading employees</p>
            <p className="text-red-400/70 text-xs mt-0.5">{error}</p>
            <button onClick={fetchEmployees} className="text-red-400 text-xs hover:text-red-300 mt-2 underline">Retry</button>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-dark-800 border border-white/8 flex items-center justify-center mb-4">
            <Users className="w-8 h-8 text-dark-500" />
          </div>
          <p className="text-dark-300 font-medium">
            {search ? 'No employees found' : 'No employees yet'}
          </p>
          <p className="text-dark-500 text-sm mt-1">
            {search ? 'Try a different search term' : isAdmin ? 'Add your first team member' : 'Contact an admin to add employees'}
          </p>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
        >
          {filtered.map((emp, idx) => (
            <EmployeeCard
              key={`${emp.name}-${emp.mail}-${idx}`}
              emp={emp}
              isAdmin={isAdmin}
              onEdit={() => { setEditTarget(emp); setShowForm(true); }}
              onDelete={() => setDeleteTarget(emp)}
            />
          ))}
        </motion.div>
      )}

      {/* Form Modal */}
      <AnimatePresence>
        {showForm && (
          <EmployeeForm
            employee={editTarget}
            onSave={() => { setShowForm(false); fetchEmployees(); }}
            onClose={() => setShowForm(false)}
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
