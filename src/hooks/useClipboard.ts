import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';

/**
 * Custom hook for clipboard copy with toast feedback
 */
export function useClipboard() {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copy = useCallback(async (text: string, id: string, label = 'Copied') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      toast.success(`${label} to clipboard!`, {
        duration: 2000,
        style: {
          background: '#1a1f2e',
          color: '#fff',
          border: '1px solid rgba(255,255,255,0.1)',
        },
        iconTheme: { primary: '#4f63f0', secondary: '#fff' },
      });
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast.error('Failed to copy to clipboard');
    }
  }, []);

  return { copy, copiedId };
}
