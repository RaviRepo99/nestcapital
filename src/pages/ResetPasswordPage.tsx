import React, { useEffect, useState } from 'react';
import { Lock, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { BrandLogo } from '../components/BrandLogo';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export const ResetPasswordPage: React.FC = () => {
  const { navigate, showToast } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setReady(!!data.session);
      if (!data.session) setError('This password reset link is invalid or expired. Please request a new link.');
    });
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    if (password.length < 6) return setError('Password must be at least 6 characters.');
    if (password !== confirmPassword) return setError('Passwords do not match.');
    try {
      setLoading(true);
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw new Error(updateError.message);
      await supabase.auth.signOut();
      setCompleted(true);
      showToast('Password updated successfully. You can now sign in.', 'success');
    } catch (err: any) {
      setError(err.message || 'Could not update password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="auth-card rounded-3xl bg-white/95 p-6 sm:p-8 text-slate-900 backdrop-blur-sm">
          <div className="text-center mb-6">
            <div className="flex justify-center mb-3"><BrandLogo size="lg" variant="dark" /></div>
            <h2 className="text-xl sm:text-2xl font-bold font-display text-slate-900">Create New Password</h2>
            <p className="text-xs text-slate-500 mt-1">Choose a secure password for your CapitalNest account.</p>
          </div>
          {completed ? (
            <div className="text-center py-4 space-y-4">
              <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-600" />
              <p className="text-xs text-slate-600">Your password has been updated successfully.</p>
              <button onClick={() => navigate('login')} className="w-full py-2.5 rounded-xl bg-[#0B192C] text-white text-xs font-semibold">Back to Sign In</button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex gap-2"><AlertCircle className="w-4 h-4 flex-shrink-0" /><span>{error}</span></div>}
              <div className="relative"><Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" /><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="New password" className="w-full rounded-xl border border-slate-300 pl-10 pr-3.5 py-2.5 text-xs text-slate-900 focus:border-amber-500 outline-none" disabled={!ready} required /></div>
              <div className="relative"><Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" /><input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Confirm new password" className="w-full rounded-xl border border-slate-300 pl-10 pr-3.5 py-2.5 text-xs text-slate-900 focus:border-amber-500 outline-none" disabled={!ready} required /></div>
              <button type="submit" disabled={!ready || loading} className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 disabled:opacity-60">{loading ? 'Updating Password...' : 'Update Password'} <ArrowRight className="w-4 h-4" /></button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
