import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

type ToastVariant = 'success' | 'error' | 'info';

export type ToastOptions = {
  title?: string;
  description?: string;
  variant?: ToastVariant;
  durationMs?: number;
};

type Toast = Required<ToastOptions> & { id: string };

type ToastContextType = {
  toast: (opts: ToastOptions) => void;
};

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx.toast;
}

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const remove = useCallback((id: string) =>
    setToasts(prev => prev.filter(t => t.id !== id)), []);

  const toast = useCallback((opts: ToastOptions) => {
    const id = Math.random().toString(36).slice(2);
    const t: Toast = {
      id,
      title: opts.title ?? '',
      description: opts.description ?? '',
      variant: opts.variant ?? 'info',
      durationMs: opts.durationMs ?? 3500,
    };
    setToasts(prev => [...prev, t]);
    window.setTimeout(() => remove(id), t.durationMs);
  }, [remove]);

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Toast viewport */}
      <div className="fixed right-4 top-4 z-[120] flex flex-col gap-3">
        {toasts.map(t => (
          <ToastCard key={t.id} toast={t} onClose={() => remove(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

const variantStyles: Record<ToastVariant, string> = {
  success: 'border-emerald-300 bg-emerald-100 text-emerald-900 dark:border-green-500/30 dark:bg-green-500/15 dark:text-green-200',
  error: 'border-rose-300 bg-rose-100 text-rose-900 dark:border-red-500/30 dark:bg-red-500/15 dark:text-red-200',
  info: 'border-zinc-300 bg-white text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100',
};

const ToastCard: React.FC<{ toast: Toast; onClose: () => void }> = ({ toast, onClose }) => {
  return (
    <div className={`min-w-[260px] max-w-[360px] rounded-xl border shadow-lg backdrop-blur-md ${variantStyles[toast.variant]}`}>
      <div className="px-4 py-3">
        {toast.title && <div className="text-sm font-semibold mb-0.5">{toast.title}</div>}
        {toast.description && <div className="text-sm opacity-90">{toast.description}</div>}
      </div>
      <button onClick={onClose} className="absolute right-2 top-2 rounded-md px-2 py-1 text-xs opacity-70 hover:opacity-100">close</button>
    </div>
  );
};


