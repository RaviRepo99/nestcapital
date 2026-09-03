import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { BrandLogo } from '../components/BrandLogo';
import { api } from '../services/api';
import { Mail, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';

export const ForgotPasswordPage: React.FC = () => {
  const { navigate, showToast } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email) {
      setError('Please enter your registered email address.');
      return;
    }

    try {
      setLoading(true);
      await api.forgotPassword(email.trim());
      setSubmitted(true);
      showToast('Password reset link dispatched.', 'info');
    } catch (err: any) {
      setError(err.message || 'Failed to request reset.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="auth-card rounded-3xl bg-white/95 p-6 sm:p-8 text-slate-900 backdrop-blur-sm">
          <div className="text-center mb-6">
            <div className="flex justify-center mb-3">
              <BrandLogo size="lg" variant="dark" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold font-display text-slate-900">
              Reset Password
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Enter your email to receive recovery instructions
            </p>
          </div>

          {submitted ? (
            <div className="text-center py-4 space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                If an account exists for <strong className="text-slate-900">{email}</strong>, a password reset link has been sent. Open it, enter a new password, and your old password will be replaced.
              </p>
              <button
                onClick={() => navigate('login')}
                className="w-full py-2.5 rounded-xl bg-[#0B192C] text-white text-xs font-semibold hover:bg-slate-800 transition"
              >
                Back to Sign In
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                  {error}
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Registered Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="yourname@example.com"
                    className="w-full rounded-xl border border-slate-300 pl-10 pr-3.5 py-2.5 text-xs text-slate-900 focus:border-amber-500 outline-none"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition"
              >
                {loading ? 'Sending Instructions...' : 'Send Reset Link'}
              </button>

              <button
                type="button"
                onClick={() => navigate('login')}
                className="w-full py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center justify-center gap-1 transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
