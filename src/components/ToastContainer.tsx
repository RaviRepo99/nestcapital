import React from 'react';
import { useAuth } from '../context/AuthContext';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useAuth();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-2xl shadow-xl border text-xs font-medium backdrop-blur-md animate-in slide-in-from-top-3 ${
            t.type === 'success'
              ? 'bg-slate-900/95 text-white border-amber-500/30 ring-1 ring-amber-500/20'
              : t.type === 'error'
              ? 'bg-rose-900/95 text-white border-rose-500/30'
              : 'bg-slate-900/95 text-white border-slate-700'
          }`}
        >
          {t.type === 'success' && <CheckCircle2 className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />}
          {t.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />}
          {t.type === 'info' && <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />}

          <div className="flex-1 leading-snug">{t.message}</div>

          <button
            onClick={() => removeToast(t.id)}
            className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition flex-shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
};
