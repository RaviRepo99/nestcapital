import React, { useEffect, useState } from 'react';
import { Download, Share2, X, CheckCircle2 } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export const PWAInstallButton: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);

  useEffect(() => {
    // Check if in standalone mode
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsInstalled(isStandalone);

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIOSDevice);

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSModal(true);
      return;
    }

    if (!deferredPrompt) {
      // Fallback instruction
      alert('To install CapitalNest Nepal, tap the browser menu (⋮) and select "Add to Home screen" or "Install App".');
      return;
    }

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setDeferredPrompt(null);
    }
  };

  if (isInstalled) {
    return null;
  }

  return (
    <>
      <button
        onClick={handleInstallClick}
        title="Install CapitalNest Nepal App"
        className={`flex items-center gap-1.5 font-medium transition-all duration-200 active:scale-95 ${
          compact
            ? 'p-2 rounded-lg bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 text-xs'
            : 'px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 hover:from-amber-400 hover:to-amber-500 shadow-sm text-xs font-semibold'
        }`}
      >
        <Download className="w-3.5 h-3.5 stroke-[2.5]" />
        {!compact && <span>Install App</span>}
      </button>

      {/* iOS Installation Guide Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl text-slate-900 border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <img src="/capitalnest.png" alt="CapitalNest Nepal" className="w-8 h-8 rounded-lg object-contain" />
                <h3 className="font-bold text-base font-display text-slate-900">Install on iPhone / iPad</h3>
              </div>
              <button
                onClick={() => setShowIOSModal(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3.5 text-xs text-slate-600">
              <div className="flex items-start gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-amber-500/20 text-amber-800 font-bold text-xs">
                  1
                </span>
                <p>
                  Tap the <strong className="text-slate-900">Share</strong> button <Share2 className="w-3.5 h-3.5 inline mx-1 text-blue-600" /> at the bottom of Safari.
                </p>
              </div>

              <div className="flex items-start gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-amber-500/20 text-amber-800 font-bold text-xs">
                  2
                </span>
                <p>
                  Scroll down the share menu and select <strong className="text-slate-900">Add to Home Screen</strong>.
                </p>
              </div>

              <div className="flex items-start gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-amber-500/20 text-amber-800 font-bold text-xs">
                  3
                </span>
                <p>
                  Tap <strong className="text-slate-900">Add</strong> in top right. Enjoy the full-screen CapitalNest Nepal app!
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowIOSModal(false)}
              className="mt-5 w-full rounded-xl bg-slate-900 py-2.5 text-xs font-semibold text-white hover:bg-slate-800 transition"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
};
