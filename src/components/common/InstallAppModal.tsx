import React from 'react';
import { usePWA, triggerHaptic } from '../../lib/pwa';
import {
  Download,
  Smartphone,
  Share2,
  PlusSquare,
  Zap,
  WifiOff,
  CheckCircle2,
  X,
  Layers,
  Sparkles,
  ArrowRight
} from 'lucide-react';

interface InstallAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InstallAppModal: React.FC<InstallAppModalProps> = ({ isOpen, onClose }) => {
  const { isInstallable, isInstalled, isIOS, promptInstall } = usePWA();

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    triggerHaptic('medium');
    const outcome = await promptInstall();
    if (outcome === 'accepted') {
      triggerHaptic('success');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="flex min-h-full items-center justify-center p-3 sm:p-6 text-center">
        <div className="relative w-full max-w-md transform rounded-3xl bg-white text-left shadow-2xl transition-all border border-slate-200 overflow-hidden">
          {/* Header Graphic */}
          <div className="relative bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-900 p-6 text-white text-center overflow-hidden">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-black/20 text-white/80 hover:text-white hover:bg-black/30 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Glowing App Icon */}
            <div className="w-20 h-20 mx-auto rounded-2xl bg-white p-2.5 shadow-xl ring-4 ring-white/20 mb-3 flex items-center justify-center">
              <img
                src="/icon.svg"
                alt="TaskFlow App Icon"
                className="w-full h-full object-contain"
                onError={e => {
                  (e.currentTarget as HTMLElement).style.display = 'none';
                }}
              />
              <Layers className="w-10 h-10 text-emerald-700 hidden" />
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-[11px] font-bold text-emerald-100 mb-2 border border-white/10">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Progressive Web App & Mobile</span>
            </div>

            <h3 className="text-xl font-extrabold tracking-tight">
              Install TaskFlow
            </h3>
            <p className="text-xs text-emerald-100/90 mt-1 max-w-xs mx-auto">
              Get the full-screen native mobile application experience on your phone, tablet, or desktop.
            </p>
          </div>

          {/* Benefits Grid */}
          <div className="p-5 sm:p-6 space-y-4">
            <div className="grid grid-cols-1 gap-2.5">
              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Native Fullscreen Mode</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    No browser search bars or tabs. Launches directly from your home screen.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <WifiOff className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Offline Resilience</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Cached local storage allows viewing deliverables and drafting tasks even without cellular signal.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Instant Launch Speed</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Pre-cached service worker boots the app in under 1 second.
                  </p>
                </div>
              </div>
            </div>

            {/* Install Action Area */}
            {isInstalled ? (
              <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200 text-center">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto mb-1.5" />
                <p className="text-xs font-bold text-emerald-900">App Already Installed</p>
                <p className="text-[11px] text-emerald-700 mt-0.5">
                  TaskFlow is active in standalone mode on your device!
                </p>
              </div>
            ) : isIOS ? (
              /* Specific iOS Safari Instructions */
              <div className="p-4 bg-amber-50/80 rounded-2xl border border-amber-200/80 text-left space-y-2.5">
                <p className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                  <Share2 className="w-4 h-4 text-amber-700" />
                  <span>How to install on iOS / Safari:</span>
                </p>
                <ol className="text-xs text-amber-900 space-y-1.5 list-decimal list-inside pl-1">
                  <li>
                    Tap the <strong>Share</strong> button <Share2 className="w-3.5 h-3.5 inline text-amber-700" /> in Safari's toolbar.
                  </li>
                  <li>
                    Scroll down and tap <strong>"Add to Home Screen"</strong> <PlusSquare className="w-3.5 h-3.5 inline text-amber-700" />.
                  </li>
                  <li>
                    Tap <strong>Add</strong> in the top-right corner to finish.
                  </li>
                </ol>
              </div>
            ) : (
              /* 1-Click Native Install Button for Android / Chrome / Windows / Mac */
              <div className="space-y-2 pt-1">
                <button
                  onClick={handleInstallClick}
                  disabled={!isInstallable}
                  className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-soft hover:shadow-soft-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Download className="w-4 h-4" />
                  <span>{isInstallable ? 'Install TaskFlow App' : 'Add to Home Screen'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                {!isInstallable && (
                  <p className="text-[11px] text-slate-400 text-center">
                    You can also tap your browser's menu (⋮) and select <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Subtle Floating Mobile Prompt Banner (auto-appears once on mobile devices)
export const MobileFloatingInstallPrompt: React.FC<{ onOpenModal: () => void }> = ({ onOpenModal }) => {
  const { isInstalled, isInstallable, isIOS } = usePWA();
  const [dismissed, setDismissed] = React.useState<boolean>(() => {
    return typeof window !== 'undefined' && sessionStorage.getItem('taskflow_pwa_dismissed') === 'true';
  });

  if (isInstalled || dismissed || (!isInstallable && !isIOS)) {
    return null;
  }

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDismissed(true);
    sessionStorage.setItem('taskflow_pwa_dismissed', 'true');
  };

  return (
    <div
      onClick={onOpenModal}
      className="md:hidden fixed bottom-18 left-3 right-3 z-40 bg-gradient-to-r from-emerald-900 via-emerald-800 to-slate-900 text-white p-3 rounded-2xl shadow-2xl border border-emerald-500/40 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-3 cursor-pointer"
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-9 h-9 rounded-xl bg-white p-1 flex-shrink-0 flex items-center justify-center shadow-sm">
          <img src="/icon.svg" alt="App" className="w-7 h-7 object-contain" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold truncate flex items-center gap-1.5">
            <span>Install TaskFlow App</span>
            <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/30 text-emerald-300 text-[9px] font-mono">PWA</span>
          </p>
          <p className="text-[10px] text-emerald-200/90 truncate">
            {isIOS ? 'Add to Home Screen for best experience' : 'Fast 1-tap install for offline access'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 flex-shrink-0">
        <button
          onClick={onOpenModal}
          className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-[11px] shadow-sm transition-all"
        >
          Install
        </button>
        <button
          onClick={handleDismiss}
          className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors"
          title="Dismiss"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
