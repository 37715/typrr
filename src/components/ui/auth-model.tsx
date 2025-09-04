import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Github } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/toast';

type Provider = 'google' | 'github' | 'x';

type Props = {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  initialMode?: 'login' | 'signup';
  onLogin?: (payload: { email: string; password: string }) => Promise<void> | void;
  onSignup?: (payload: { name: string; email: string; password: string }) => Promise<void> | void;
  onSocial?: (provider: Provider) => Promise<void> | void;
  onClose?: () => void;
};

export default function GlassAuthModal({
  open,
  onOpenChange,
  initialMode = 'login',
  onLogin,
  onSignup,
  onSocial,
  onClose,
}: Props) {
  const isControlled = open !== undefined;
  const [openInternal, setOpenInternal] = useState(false);
  const isOpen = isControlled ? (open as boolean) : openInternal;
  const setOpen = (v: boolean) => (isControlled ? onOpenChange?.(v) : setOpenInternal(v));

  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const modalRef = useRef<HTMLDivElement | null>(null);
  const firstFieldRef = useRef<HTMLInputElement | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    setPassword('');
  }, [mode]);

  const handleClose = () => {
    setOpen(false);
    onClose?.();
  };

  useEffect(() => {
    if (!isOpen) return;
    const toFocus = firstFieldRef.current ?? closeBtnRef.current;
    toFocus?.focus({ preventScroll: true });

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, mode]);

  const onOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) handleClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      if (mode === 'login') {
        await onLogin?.({ email, password });
      } else {
        await onSignup?.({ name, email, password });
      }
      if (onLogin || onSignup) handleClose();
      toast({ variant: 'success', title: mode === 'login' ? 'signed in' : 'account created' });
    } catch (err) {
      console.error(err);
      toast({ variant: 'error', title: 'auth error', description: 'please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSocial = async (provider: Provider) => {
    if (loading) return;
    setLoading(true);
    try {
      if (onSocial) {
        await onSocial(provider);
      } else {
        const redirectUrl = window.location.origin.includes('localhost') 
          ? `${window.location.origin}/profile?from=oauth`
          : `${window.location.origin}/profile?from=oauth`;
        await supabase.auth.signInWithOAuth({ provider, options: { redirectTo: redirectUrl } });
      }
      if (onSocial) {
        handleClose();
        toast({ variant: 'success', title: `${provider} sign-in started` });
      }
    } catch (err) {
      console.error(err);
      toast({ variant: 'error', title: 'auth error', description: 'oauth failed to start' });
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-start justify-center p-4 sm:p-6 overflow-y-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={onOverlayClick}
          aria-modal="true"
          role="dialog"
          aria-labelledby="auth-modal-title"
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

          <motion.div
            ref={modalRef}
            className="relative z-10 w-full max-w-md mt-24 sm:mt-28 md:mt-32 mb-24"
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 260, damping: 24 }}
          >
            <div className="overflow-auto max-h-[90vh] rounded-2xl border border-zinc-300 bg-white shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-neutral-900/90">
              <div className="flex items-center justify-between px-5 pb-2 pt-4 sm:px-6">
                <div className="flex gap-1 rounded-full bg-zinc-200 p-1 dark:bg-white/5">
                  <button
                    type="button"
                    onClick={() => setMode('login')}
                    className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                      mode === 'login' ? 'bg-white text-zinc-900 shadow-sm dark:bg-white/90' : 'text-zinc-600 hover:text-zinc-900 dark:text-white/80 dark:hover:text-white'
                    }`}
                  >
                    sign in
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode('signup')}
                    className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                      mode === 'signup' ? 'bg-white text-zinc-900 shadow-sm dark:bg-white/90' : 'text-zinc-600 hover:text-zinc-900 dark:text-white/80 dark:hover:text-white'
                    }`}
                  >
                    create account
                  </button>
                </div>

                <button
                  ref={closeBtnRef}
                  type="button"
                  onClick={handleClose}
                  aria-label="Close"
                  className="rounded-full border border-zinc-300 bg-zinc-100 p-2 text-zinc-600 transition hover:bg-zinc-200 hover:text-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:border-white/10 dark:bg-white/5 dark:text-white/80 dark:hover:bg-white/10 dark:hover:text-white"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18" />
                    <path d="M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="px-5 pb-5 sm:px-6 sm:pb-6">
                <h2 id="auth-modal-title" className="sr-only">
                  {mode === 'login' ? 'Sign in' : 'Create account'}
                </h2>

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <SocialButton label="google" onClick={() => handleSocial('google')} />
                  <SocialButton
                    label="github"
                    onClick={() => handleSocial('github')}
                    Icon={<Github size={18} className="text-zinc-900 dark:text-white" />}
                  />
                </div>

                <div className="my-4 flex items-center gap-3">
                  <div className="h-px flex-1 bg-zinc-300 dark:bg-white/10" />
                  <span className="text-xs uppercase tracking-wide text-zinc-600 dark:text-white/70">or</span>
                  <div className="h-px flex-1 bg-zinc-300 dark:bg-white/10" />
                </div>

                <form onSubmit={handleSubmit} className="space-y-3">
                  {mode === 'login' && (
                    <Field ref={firstFieldRef} label="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
                  )}

                  {mode === 'signup' && (
                    <Field ref={firstFieldRef} label="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
                  )}

                  <Field
                    label="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                    trailing={
                      <button
                        type="button"
                        onClick={() => setShowPassword((s) => !s)}
                        className="rounded-md px-2 py-1 text-xs text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-300 dark:text-white/80 dark:hover:bg-white/10 dark:hover:text-white"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? 'hide' : 'show'}
                      </button>
                    }
                  />

                  <button
                    type="submit"
                    disabled={loading || (!email || !password)}
                    className="mt-1 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-300 bg-zinc-900 px-4 py-2.5 font-semibold text-white shadow-sm transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-white dark:text-zinc-900 dark:hover:bg-white/90"
                  >
                    {loading && (
                      <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z" />
                      </svg>
                    )}
                    {mode === 'login' ? 'sign in' : 'create account'}
                  </button>
                </form>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}

type FieldProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  trailing?: React.ReactNode;
};

const Field = React.forwardRef<HTMLInputElement, FieldProps>(function Field({ label, trailing, className = '', ...rest }, ref) {
  const id = React.useId();
  return (
    <label htmlFor={id} className="block">
      <span className="mb-1 block text-sm font-medium text-zinc-800 dark:text-white/90">{label}</span>
      <div className="flex items-stretch rounded-xl border border-zinc-300 bg-white focus-within:border-zinc-400 dark:border-white/10 dark:bg-white/5 dark:focus-within:border-white/30">
        <input
          ref={ref}
          id={id}
          className={`w-full rounded-xl bg-transparent px-3 py-2.5 text-zinc-900 placeholder-zinc-400 outline-none dark:text-white dark:placeholder-white/50 ${className}`}
          {...rest}
        />
        {trailing ? <div className="flex items-center pr-2">{trailing}</div> : null}
      </div>
    </label>
  );
});

function SocialButton({ label, onClick, loading }: { label: string; onClick?: () => void; loading?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="group inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-400 bg-zinc-50 px-3 py-2 text-sm font-medium text-zinc-800 shadow-sm transition hover:bg-zinc-100 hover:border-zinc-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
    >
      <span>{label}</span>
    </button>
  );
}


