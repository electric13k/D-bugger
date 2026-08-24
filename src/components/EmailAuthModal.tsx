import React, { useEffect, useState } from 'react';
import { Eye, EyeOff, Loader2, LogIn, UserPlus, X } from 'lucide-react';
import { registerWithEmail, signInWithEmail, signInWithGoogle } from '../lib/workspaceAuth';

interface EmailAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EmailAuthModal: React.FC<EmailAuthModalProps> = ({ isOpen, onClose }) => {
  const [mode, setMode] = useState<'signin' | 'register'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (isOpen) setError('');
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    if (mode === 'register' && password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      if (mode === 'register') await registerWithEmail(email, password, displayName);
      else await signInWithEmail(email, password);
      setEmail('');
      setPassword('');
      setDisplayName('');
      setConfirmPassword('');
      onClose();
    } catch (authError: any) {
      setError(authError?.message || 'Unable to authenticate with that email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true" aria-labelledby="email-auth-title">
      <div className="w-full max-w-md border-2 border-black bg-[#F9F7F2] text-[#121212] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex items-start justify-between border-b-2 border-black bg-white p-5">
          <div>
            <p className="text-[10px] font-sans font-bold uppercase tracking-[0.2em] text-[#121212]/60">D-Bugger Workspace</p>
            <h2 id="email-auth-title" className="mt-1 font-serif-heading text-3xl font-black uppercase tracking-tight">
              {mode === 'signin' ? 'Sign In' : 'Create Account'}
            </h2>
            <p className="mt-1 text-xs font-sans text-[#121212]/65">Use your email and password. No popup or repeated email prompt.</p>
          </div>
          <button type="button" onClick={onClose} className="border border-black bg-white p-1.5 hover:bg-[#F9F7F2]" title="Close">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          {mode === 'register' && (
            <label className="block space-y-1">
              <span className="text-[10px] font-sans font-bold uppercase tracking-wider">Display name (optional)</span>
              <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} maxLength={80} autoComplete="name" className="w-full border border-black bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-400" />
            </label>
          )}
          <label className="block space-y-1">
            <span className="text-[10px] font-sans font-bold uppercase tracking-wider">Email address</span>
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" className="w-full border border-black bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-400" />
          </label>
          <label className="block space-y-1">
            <span className="text-[10px] font-sans font-bold uppercase tracking-wider">Password</span>
            <div className="relative">
              <input type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} required minLength={8} maxLength={128} autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} className="w-full border border-black bg-white px-3 py-2 pr-10 text-sm outline-none focus:ring-2 focus:ring-amber-400" />
              <button type="button" onClick={() => setShowPassword((visible) => !visible)} className="absolute right-1 top-1/2 -translate-y-1/2 border border-transparent p-1.5 text-[#121212]/70 hover:border-black hover:text-black" aria-label={showPassword ? 'Hide password' : 'Show password'} title={showPassword ? 'Hide password' : 'Show password'}>
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {mode === 'register' && <span className="block text-[10px] text-[#121212]/60">Use at least 8 characters.</span>}
          </label>
          {mode === 'register' && (
            <label className="block space-y-1">
              <span className="text-[10px] font-sans font-bold uppercase tracking-wider">Confirm password</span>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required minLength={8} maxLength={128} autoComplete="new-password" className="w-full border border-black bg-white px-3 py-2 pr-10 text-sm outline-none focus:ring-2 focus:ring-amber-400" />
                <button type="button" onClick={() => setShowPassword((visible) => !visible)} className="absolute right-1 top-1/2 -translate-y-1/2 border border-transparent p-1.5 text-[#121212]/70 hover:border-black hover:text-black" aria-label={showPassword ? 'Hide confirmation password' : 'Show confirmation password'} title={showPassword ? 'Hide password' : 'Show password'}>
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </label>
          )}

          {error && <p className="border border-red-700 bg-red-50 px-3 py-2 text-xs font-sans text-red-800" role="alert">{error}</p>}

          <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 border border-black bg-black px-4 py-3 text-xs font-sans font-bold uppercase tracking-[0.16em] text-[#F9F7F2] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all hover:bg-neutral-800 disabled:cursor-wait disabled:opacity-60">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : mode === 'signin' ? <LogIn className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
            {loading ? 'Working...' : mode === 'signin' ? 'Sign In' : 'Create Account'}
          </button>

          {mode === 'signin' && <>
            <div className="flex items-center gap-2 text-[10px] font-sans uppercase tracking-wider text-[#121212]/50"><span className="h-px flex-1 bg-black/20" />or<span className="h-px flex-1 bg-black/20" /></div>
            <button type="button" disabled={loading} onClick={async () => { setError(''); setLoading(true); try { await signInWithGoogle(); } catch (authError: any) { setError(authError?.message || 'Google sign-in could not start.'); setLoading(false); } }} className="flex w-full items-center justify-center gap-2 border border-black bg-white px-4 py-3 text-xs font-sans font-bold uppercase tracking-[0.16em] text-[#121212] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all hover:bg-[#F9F7F2] disabled:cursor-wait disabled:opacity-60">
              <span className="font-serif-heading text-base font-black">G</span>
              Continue with Google
            </button>
          </>}

          <button type="button" onClick={() => { setMode(mode === 'signin' ? 'register' : 'signin'); setError(''); }} className="w-full text-center text-[10px] font-sans font-bold uppercase tracking-wider text-[#121212]/70 underline underline-offset-4 hover:text-black">
            {mode === 'signin' ? 'Need an account? Create one' : 'Already have an account? Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
};
