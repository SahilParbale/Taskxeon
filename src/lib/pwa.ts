import { useState, useEffect, useCallback } from 'react';

// BeforeInstallPromptEvent type definition
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

// Global variable to retain the install prompt across renders
let deferredInstallPrompt: BeforeInstallPromptEvent | null = null;
const installListeners = new Set<() => void>();

// Register Service Worker
export function registerServiceWorker() {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then(registration => {
          console.log('[PWA] Service Worker registered with scope:', registration.scope);

          // Handle automatic updates
          registration.addEventListener('updatefound', () => {
            const installingWorker = registration.installing;
            if (installingWorker) {
              installingWorker.addEventListener('statechange', () => {
                if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  console.log('[PWA] New version available. Instant reload available.');
                }
              });
            }
          });
        })
        .catch(error => {
          console.warn('[PWA] Service Worker registration failed:', error);
        });
    });

    // Listen for beforeinstallprompt event globally
    window.addEventListener('beforeinstallprompt', e => {
      e.preventDefault();
      deferredInstallPrompt = e as BeforeInstallPromptEvent;
      installListeners.forEach(listener => listener());
    });

    // Listen for appinstalled event
    window.addEventListener('appinstalled', () => {
      deferredInstallPrompt = null;
      installListeners.forEach(listener => listener());
      console.log('[PWA] App successfully installed on device!');
    });
  }
}

// Native mobile haptic feedback helper
export function triggerHaptic(type: 'light' | 'medium' | 'success' | 'warning' = 'light') {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      switch (type) {
        case 'light':
          navigator.vibrate(12);
          break;
        case 'medium':
          navigator.vibrate(24);
          break;
        case 'success':
          navigator.vibrate([15, 60, 25]);
          break;
        case 'warning':
          navigator.vibrate([30, 80, 40]);
          break;
      }
    } catch {
      // Haptic not supported or blocked by user preference
    }
  }
}

// Custom React Hook for PWA and Mobile Integration
export function usePWA() {
  const [isInstallable, setIsInstallable] = useState<boolean>(() => !!deferredInstallPrompt);
  const [isInstalled, setIsInstalled] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://')
    );
  });

  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });

  // Detect iOS Safari (needs "Add to Home Screen" instructions instead of automatic prompt)
  const [isIOS, setIsIOS] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const userAgent = window.navigator.userAgent.toLowerCase();
    const isAppleDevice = /iphone|ipad|ipod/.test(userAgent);
    const isSafari = /safari/.test(userAgent) && !/chrome|crios|fxios/.test(userAgent);
    setIsIOS(isAppleDevice && isSafari);

    // Sync installable state
    const updateInstallable = () => {
      setIsInstallable(!!deferredInstallPrompt);
    };

    installListeners.add(updateInstallable);

    // Network connection listeners
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check display mode changes (e.g. user launches from home screen icon)
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleDisplayMode = (e: MediaQueryListEvent) => {
      setIsInstalled(e.matches);
    };
    mediaQuery.addEventListener('change', handleDisplayMode);

    return () => {
      installListeners.delete(updateInstallable);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      mediaQuery.removeEventListener('change', handleDisplayMode);
    };
  }, []);

  // Trigger Native PWA installation prompt
  const promptInstall = useCallback(async (): Promise<'accepted' | 'dismissed' | 'unsupported'> => {
    if (!deferredInstallPrompt) {
      return 'unsupported';
    }

    try {
      await deferredInstallPrompt.prompt();
      const choiceResult = await deferredInstallPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        deferredInstallPrompt = null;
        setIsInstallable(false);
      }
      return choiceResult.outcome;
    } catch (err) {
      console.warn('[PWA] Prompt error:', err);
      return 'dismissed';
    }
  }, []);

  return {
    isInstallable,
    isInstalled,
    isOnline,
    isIOS,
    promptInstall
  };
}
