import { useState } from 'react';
import { motion } from 'framer-motion';
import { Star, Eye, EyeOff, Copy, Check } from 'lucide-react';
import { usePasswords } from '@/context/PasswordContext';
import { SearchBar } from '@/components/SearchBar';
import { StrengthBadge } from '@/components/StrengthBadge';
import { useClipboard } from '@/hooks/useClipboard';
import { maskPassword } from '@/utils/passwordUtils';
import { CATEGORY_ICONS } from '@/context/PasswordContext';
import { format } from 'date-fns';

export function FavoritesPage() {
  const { passwords, toggleFavorite } = usePasswords();
  const { copy, copiedId } = useClipboard();
  const [search, setSearch] = useState('');
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());

  const favorites = passwords.filter((p) => p.favorite);
  const filtered = favorites.filter((p) => {
    const q = search.toLowerCase();
    return (
      p.website.toLowerCase().includes(q) ||
      p.email.toLowerCase().includes(q) ||
      p.username.toLowerCase().includes(q)
    );
  });

  const toggleReveal = (id: string) => {
    setRevealedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-5 max-w-5xl mx-auto">
      <div>
        <h1 className="text-white font-bold text-lg sm:text-xl flex items-center gap-2">
          <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
          Favorites
        </h1>
        <p className="text-dark-400 text-xs sm:text-sm mt-0.5">{favorites.length} starred entries</p>
      </div>

      <SearchBar value={search} onChange={setSearch} placeholder="Search favorites..." />

      {filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-20 text-center"
        >
          <Star className="w-12 h-12 text-dark-700 mb-4" />
          <p className="text-dark-400 font-medium">No favorites yet</p>
          <p className="text-dark-600 text-sm mt-1">Star passwords from the vault to see them here</p>
        </motion.div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {filtered.map((pw, i) => {
            const isRevealed = revealedIds.has(pw.id);
            return (
              <motion.div
                key={pw.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                whileHover={{ scale: 1.01 }}
                className="rounded-2xl bg-dark-900/60 border border-amber-500/10 hover:border-amber-500/25 p-4 transition-all group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-lg">
                      {CATEGORY_ICONS[pw.category]}
                    </div>
                    <div>
                      <p className="text-white font-semibold text-sm">{pw.website}</p>
                      <p className="text-dark-400 text-xs">{pw.category}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <StrengthBadge strength={pw.strength} size="sm" />
                    <button
                      onClick={() => toggleFavorite(pw.id)}
                      className="p-1.5 rounded-lg hover:bg-amber-500/10 transition-colors"
                    >
                      <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  {pw.email && (
                    <div className="flex items-center justify-between">
                      <span className="text-dark-400 text-xs">Email:</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-dark-200 text-xs font-mono">{pw.email}</span>
                        <button onClick={() => copy(pw.email, `fav-email-${pw.id}`, 'Email')} className="text-dark-500 hover:text-white transition-colors">
                          {copiedId === `fav-email-${pw.id}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-dark-400 text-xs">Password:</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-dark-200 text-xs font-mono tracking-widest">
                        {isRevealed ? pw.password : maskPassword(pw.password)}
                      </span>
                      <button onClick={() => toggleReveal(pw.id)} className="text-dark-500 hover:text-white transition-colors">
                        {isRevealed ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      </button>
                      <button onClick={() => copy(pw.password, `fav-pass-${pw.id}`, 'Password')} className="text-dark-500 hover:text-white transition-colors">
                        {copiedId === `fav-pass-${pw.id}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
                  <span className="text-dark-600 text-xs">Updated {format(new Date(pw.updatedAt), 'MMM d, yyyy')}</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
