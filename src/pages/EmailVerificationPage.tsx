import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, Mail, RefreshCw, ShieldCheck } from 'lucide-react';
import { BrandLogo } from '../components/BrandLogo';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

export const EmailVerificationPage: React.FC = () => {
  const { navigate, showToast, completeEmailVerification } = useAuth();
  const email = sessionStorage.getItem('capitalnest_pending_email') || '';
  const maskedEmail = email.replace(/^(.{2}).*(@.*)$/, '$1***$2');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(() => {
    const sentAt = Number(sessionStorage.getItem('capitalnest_verification_sent_at') || 0);
    return Math.max(0, 60 - Math.floor((Date.now() - sentAt) / 1000));
  });
  const [error, setError] = useState<string | null>(null);
  const submittingRef = useRef(false);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = window.setInterval(() => setResendCooldown((seconds) => Math.max(0, seconds - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [resendCooldown]);

  const handleVerify = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    if (loading || submittingRef.current) return;
    submittingRef.current = true;
    const normalizedEmail = email.trim().toLowerCase();
    const otp = code.replace(/\D/g, '');
    if (!normalizedEmail || (otp.length !== 6 && otp.length !== 8)) {
      setError('Enter the 6-digit code from the verification email.');
      submittingRef.current = false;
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase.auth.verifyOtp({ email: normalizedEmail, token: otp, type: 'email' });
      if (error) {
        const currentSession = (await supabase.auth.getSession()).data.session;
        if (currentSession?.user.email_confirmed_at && currentSession.access_token) {
          await completeEmailVerification(currentSession.access_token);
          sessionStorage.removeItem('capitalnest_pending_email');
          sessionStorage.removeItem('capitalnest_referral_code');
          return;
        }
        console.error('Supabase email OTP verification failed:', {
          message: error.message,
          name: error.name,
          status: error.status,
          code: error.code,
        });
        setCode('');
        if (error.code === 'otp_expired' || /expired/i.test(error.message)) {
          setResendCooldown(0);
          sessionStorage.removeItem('capitalnest_verification_sent_at');
          setError('This code expired. Click “Resend code” to request a fresh one.');
        } else {
          setError(error.message);
        }
        return;
      }
      console.log('Email verified:', data);
      const session = data.session || (await supabase.auth.getSession()).data.session;
      if (!session?.access_token || !session.user.email_confirmed_at) {
        throw new Error('Email verification did not complete. Please request a new code and try again.');
      }
      await completeEmailVerification(session.access_token);
      sessionStorage.removeItem('capitalnest_pending_email');
      sessionStorage.removeItem('capitalnest_referral_code');
    } catch (err: any) {
      setError(err.message || 'Invalid or expired verification code.');
    } finally {
      submittingRef.current = false;
      setLoading(false);
    }
  };

  const resendCode = async () => {
    setError(null);
    if (!email) {
      setError('No pending registration email was found. Please register again.');
      return;
    }
    try {
      setResending(true);
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email: email.trim().toLowerCase(),
      });
      if (resendError) {
        if (resendError.status === 429 || /rate|too many/i.test(resendError.message)) {
          setResendCooldown(60);
          sessionStorage.setItem('capitalnest_verification_sent_at', String(Date.now()));
          throw new Error('Too many code requests. Please wait 60 seconds before trying again.');
        }
        throw new Error(resendError.message);
      }
      setCode('');
      setError('');
      setResendCooldown(60);
      sessionStorage.setItem('capitalnest_verification_sent_at', String(Date.now()));
      showToast('A new verification code has been sent.', 'success');
    } catch (err: any) {
      setError(err.message || 'Could not resend the verification code.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="auth-page flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="auth-card rounded-3xl bg-white/95 p-6 sm:p-8 text-slate-900 backdrop-blur-sm">
          <div className="text-center mb-6">
            <div className="flex justify-center mb-3"><BrandLogo size="lg" variant="dark" /></div>
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
              <Mail className="h-6 w-6" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold font-display text-slate-900">Verify your email</h2>
            <p className="text-xs text-slate-500 mt-1">Enter the 6 or 8-digit code sent to {maskedEmail || 'your email address'}.</p>
          </div>

          {error && <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">{error}</div>}

          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Verification Code</label>
              <input type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={8} value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 8))} placeholder="000000 or 00000000" className="w-full rounded-xl border border-slate-300 pl-3.5 pr-3.5 py-3 text-center text-lg tracking-[0.25em] font-bold text-slate-900 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none" required />
            </div>
            <button type="submit" disabled={loading} className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 disabled:opacity-60">
              {loading ? 'Verifying...' : 'Verify Email'} <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <button type="button" onClick={resendCode} disabled={resending || resendCooldown > 0} className="mt-4 w-full flex items-center justify-center gap-2 text-xs font-bold text-amber-600 hover:text-amber-700 disabled:opacity-60">
            <RefreshCw className="h-3.5 w-3.5" /> {resending ? 'Sending...' : resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend code'}
          </button>
          <button type="button" onClick={() => navigate('login')} className="mt-4 w-full text-xs text-slate-500 hover:text-slate-700">Back to Sign In</button>
        </div>
        <div className="mt-4 text-center flex items-center justify-center gap-1 text-[11px] text-slate-400"><ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /><span>Secure email verification</span></div>
      </div>
    </div>
  );
};