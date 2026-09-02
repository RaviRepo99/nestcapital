import React, { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { BrandLogo } from './BrandLogo';
import { ShieldCheck, Lock } from 'lucide-react';

export const SplashScreen: React.FC = () => {
  const { isAuthenticated, navigate, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    const timer = setTimeout(() => {
      if (isAuthenticated) {
        navigate(window.location.pathname === '/admin' ? 'admin' : 'dashboard');
      } else {
        navigate(window.location.pathname === '/admin' ? 'admin-login' : 'login');
      }
    }, 1600);

    return () => clearTimeout(timer);
  }, [isAuthenticated, isLoading, navigate]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-gradient-to-b from-[#07111F] via-[#0B192C] to-[#050C16] text-white p-8 select-none">
      {/* Background ambient glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

      <div className="w-full flex justify-end">
        <span className="text-[11px] font-medium text-amber-400/60 flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5" /> 256-Bit Encrypted
        </span>
      </div>

      {/* Center Hero */}
      <div className="flex flex-col items-center text-center -mt-8">
        <div className="relative mb-6 animate-pulse">
          <img src="/capitalnest.png" alt="CapitalNest Nepal" className="w-72 max-w-[80vw] object-contain" />
        </div>

        <h1 className="text-3xl font-extrabold tracking-tight font-display text-white">
          Capital<span className="text-amber-400">Nest</span> <span className="text-sm font-sans font-bold uppercase bg-amber-500 text-slate-950 px-2 py-0.5 rounded ml-1">Nepal</span>
        </h1>

        <p className="text-slate-400 text-sm font-medium mt-2 tracking-wide">
          Smart. Secure. Simple.
        </p>

        {/* Loading Spinner */}
        <div className="mt-10 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse delay-100" />
          <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse delay-200" />
        </div>
      </div>

      {/* Footer */}
      <div className="flex flex-col items-center text-center space-y-1 text-xs text-slate-500">
        <div className="flex items-center gap-1 text-slate-400 text-[11px]">
          <Lock className="w-3 h-3 text-amber-400" /> Nepal's Modern Fintech Investment App
        </div>
        <p className="text-[10px] text-slate-600">© {new Date().getFullYear()} CapitalNest Nepal. All rights reserved.</p>
      </div>
    </div>
  );
};
