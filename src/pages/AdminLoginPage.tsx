import React, { useState } from 'react';
import { ArrowRight, Lock, Mail, ShieldCheck } from 'lucide-react';
import { BrandLogo } from '../components/BrandLogo';
import { useAuth } from '../context/AuthContext';

export const AdminLoginPage: React.FC = () => {
  const { loginAsAdmin, navigate } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    try {
      setLoading(true);
      await loginAsAdmin(email.trim(), password);
    } catch (err: any) {
      setError(err.message || 'Invalid administrator credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="auth-card rounded-3xl bg-white/95 p-6 sm:p-8 text-slate-900 backdrop-blur-sm">
          <div className="text-center mb-7">
            <div className="flex justify-center mb-4"><BrandLogo size="lg" variant="dark" /></div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-600">
              <ShieldCheck className="w-3.5 h-3.5" /> Secure admin access
            </div>
            <h1 className="mt-3 text-2xl font-bold font-display">Administrator Login</h1>
            <p className="mt-1 text-xs text-slate-500">Sign in to manage CapitalNest operations.</p>
          </div>

          {error && <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-700">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-bold text-slate-700">Admin Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="admin@example.com" className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-3.5 text-xs text-slate-900 outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10" required />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-slate-700">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter admin password" className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-3.5 text-xs text-slate-900 outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10" required />
              </div>
            </div>
            <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 text-xs font-bold text-white shadow-lg shadow-slate-900/15 transition hover:bg-slate-700 disabled:opacity-60">
              {loading ? 'Signing in...' : 'Sign In as Admin'} <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          <button type="button" onClick={() => navigate('login')} className="mt-5 w-full text-center text-xs font-semibold text-slate-500 transition hover:text-slate-900">Back to user login</button>
        </div>
      </div>
    </main>
  );
};
