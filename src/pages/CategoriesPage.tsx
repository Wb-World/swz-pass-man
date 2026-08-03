import { motion } from 'framer-motion';
import { FolderOpen, KeyRound } from 'lucide-react';
import { usePasswords, ALL_CATEGORIES, CATEGORY_ICONS } from '@/context/PasswordContext';
import { StrengthBadge } from '@/components/StrengthBadge';
import { useNavigate } from 'react-router-dom';
import type { Category } from '@/types';

export function CategoriesPage() {
  const { passwords, stats } = usePasswords();
  const navigate = useNavigate();

  return (
    <div className="p-6 space-y-5 max-w-5xl mx-auto">
      <div>
        <h1 className="text-white font-bold text-xl flex items-center gap-2">
          <FolderOpen className="w-5 h-5 text-brand-400" />
          Categories
        </h1>
        <p className="text-dark-400 text-sm mt-0.5">Browse passwords by category</p>
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {ALL_CATEGORIES.map((cat, i) => {
          const count = stats.categories[cat] ?? 0;
          const catPasswords = passwords.filter((p) => p.category === cat).slice(0, 3);
          const weakCount = passwords.filter((p) => p.category === cat && p.strength === 'weak').length;
          const strongCount = passwords.filter((p) => p.category === cat && p.strength === 'strong').length;

          return (
            <motion.div
              key={cat}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              whileHover={{ scale: 1.02 }}
              onClick={() => navigate(`/passwords?category=${encodeURIComponent(cat)}`)}
              className="rounded-2xl bg-dark-900/60 border border-white/8 hover:border-brand-500/20 p-5 cursor-pointer transition-all"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-2xl">
                  {CATEGORY_ICONS[cat as Category]}
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">{cat}</p>
                  <p className="text-dark-400 text-xs">{count} {count === 1 ? 'entry' : 'entries'}</p>
                </div>
              </div>

              {/* Mini stats */}
              <div className="flex gap-3 mb-3">
                <div className="flex-1 px-2.5 py-2 rounded-xl bg-dark-800/60 border border-white/5 text-center">
                  <p className="text-emerald-400 text-sm font-bold">{strongCount}</p>
                  <p className="text-dark-500 text-xs">Strong</p>
                </div>
                <div className="flex-1 px-2.5 py-2 rounded-xl bg-dark-800/60 border border-white/5 text-center">
                  <p className="text-red-400 text-sm font-bold">{weakCount}</p>
                  <p className="text-dark-500 text-xs">Weak</p>
                </div>
              </div>

              {/* Recent entries preview */}
              {catPasswords.length > 0 ? (
                <div className="space-y-1.5">
                  {catPasswords.map((pw) => (
                    <div key={pw.id} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-dark-800/40">
                      <KeyRound className="w-3 h-3 text-dark-500 flex-shrink-0" />
                      <span className="text-dark-300 text-xs truncate flex-1">{pw.website}</span>
                      <StrengthBadge strength={pw.strength} size="sm" />
                    </div>
                  ))}
                  {count > 3 && (
                    <p className="text-dark-500 text-xs text-center pt-1">+{count - 3} more</p>
                  )}
                </div>
              ) : (
                <p className="text-dark-600 text-xs text-center py-2">No entries yet</p>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
