import React from 'react';
import { usePWA } from '../../lib/pwa';
import { WifiOff, AlertCircle } from 'lucide-react';

export const OfflineBanner: React.FC = () => {
  const { isOnline } = usePWA();

  if (isOnline) return null;

  return (
    <div className="bg-amber-600 text-white px-3 py-1.5 text-center text-xs font-semibold flex items-center justify-center gap-2 shadow-sm animate-in fade-in slide-in-from-top-1 z-50">
      <WifiOff className="w-3.5 h-3.5 flex-shrink-0 animate-pulse" />
      <span>
        You are currently offline. TaskFlow is running in local offline mode with cached data.
      </span>
    </div>
  );
};
