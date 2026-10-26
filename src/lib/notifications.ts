// TaskFlow Enterprise Default System Notification Engine
// Dispatches native operating system notifications using the W3C Notification API
// and ServiceWorker platform. Relies on the host OS (Windows, Android, macOS, iOS)
// to display native toast banners and play the device's default notification ring sound.

export type NotificationPermissionStatus = 'default' | 'granted' | 'denied' | 'unsupported';

export function isSystemNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function getSystemNotificationPermission(): NotificationPermissionStatus {
  if (!isSystemNotificationSupported()) {
    return 'unsupported';
  }
  return Notification.permission as NotificationPermissionStatus;
}

export async function requestSystemNotificationPermission(): Promise<NotificationPermissionStatus> {
  if (!isSystemNotificationSupported()) {
    return 'unsupported';
  }

  try {
    const permission = await Notification.requestPermission();
    return permission as NotificationPermissionStatus;
  } catch (err) {
    console.warn('[SystemNotifications] Permission request error:', err);
    return Notification.permission as NotificationPermissionStatus;
  }
}

export interface SystemNotificationOptions {
  body?: string;
  tag?: string;
  data?: any;
  silent?: boolean; // false = OS plays its native system notification ring chime
  requireInteraction?: boolean;
}

/**
 * Dispatches a native operating system notification (Windows Toast / Android / macOS).
 * Ensures the operating system's default notification chime / ring plays natively.
 */
export async function dispatchSystemNotification(
  title: string,
  options: SystemNotificationOptions = {}
): Promise<NotificationPermissionStatus> {
  if (!isSystemNotificationSupported()) {
    console.warn('[SystemNotifications] Notification API is not supported in this browser.');
    return 'unsupported';
  }

  let permission = Notification.permission as NotificationPermissionStatus;

  // If permission has not yet been granted or denied, request it immediately from the user
  if (permission === 'default') {
    try {
      permission = (await Notification.requestPermission()) as NotificationPermissionStatus;
    } catch (e) {
      console.warn('[SystemNotifications] Permission request error:', e);
    }
  }

  if (permission !== 'granted') {
    return permission;
  }

  const {
    body = '',
    tag = `taskflow-${Date.now()}`,
    data = {},
    silent = false, // Must be false so the OS plays its default notification sound
    requireInteraction = false
  } = options;

  // Trigger device vibration if available on mobile
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate([200, 100, 200]);
    } catch {
      // Haptic vibration blocked or unsupported
    }
  }

  try {
    // 1. Dispatch via ServiceWorker registration if ready (delivers to OS even if tab is minimized or backgrounded)
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready;
        if (registration && registration.showNotification) {
          await registration.showNotification(title, {
            body,
            icon: '/icon.svg',
            badge: '/favicon.svg',
            tag,
            silent, // System plays default notification ring chime
            requireInteraction,
            data: {
              url: window.location.origin,
              ...data
            }
          } as any);
          return 'granted';
        }
      } catch (swErr) {
        console.warn('[SystemNotifications] ServiceWorker notification error, falling back to window Notification:', swErr);
      }
    }

    // 2. Fallback to standard window Notification instance (native OS toast in Windows/macOS)
    const notification = new Notification(title, {
      body,
      icon: '/icon.svg',
      badge: '/favicon.svg',
      tag,
      silent, // System plays default notification ring chime
      data
    } as any);

    notification.onclick = () => {
      window.focus?.();
      notification.close();
    };

    return 'granted';
  } catch (error) {
    console.warn('[SystemNotifications] Notification dispatch failed:', error);
    try {
      // Simplest fallback without extra options
      const simpleNotif = new Notification(title, { body });
      simpleNotif.onclick = () => {
        window.focus?.();
        simpleNotif.close();
      };
      return 'granted';
    } catch {
      return 'granted';
    }
  }
}

// Aliases for backwards compatibility with existing codebase
export const dispatchRealNotification = (title: string, options: any = {}) =>
  dispatchSystemNotification(title, {
    body: options.body,
    tag: options.tag,
    data: options.data,
    silent: options.silent || false
  });

export const getNotificationPermission = getSystemNotificationPermission;
export const requestNotificationPermission = requestSystemNotificationPermission;
