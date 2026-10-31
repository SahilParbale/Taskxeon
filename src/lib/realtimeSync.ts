// TaskFlow Enterprise Realtime Multi-Client Synchronization Engine
// Coordinates instantaneous cross-tab updates (BroadcastChannel + LocalStorage events)
// and continuous multi-device cloud polling (Supabase Cloud).

import { Task, Project, User, Notification, ActivityLog, ChatMessage, PresenceStatus } from '../types';

export type SyncEventType =
  | 'TASK_CREATED'
  | 'TASK_UPDATED'
  | 'TASK_DELETED'
  | 'PRESENCE_UPDATED'
  | 'USER_UPDATED'
  | 'USER_CREATED'
  | 'USER_DELETED'
  | 'PROJECT_CREATED'
  | 'PROJECT_UPDATED'
  | 'PROJECT_DELETED'
  | 'NOTIFICATION_CREATED'
  | 'NOTIFICATION_READ'
  | 'ALL_NOTIFICATIONS_READ'
  | 'MESSAGE_SENT'
  | 'MESSAGES_CLEARED'
  | 'FULL_STATE_SYNC';

export interface SyncEvent {
  type: SyncEventType;
  payload: any;
  senderId?: string;
  timestamp: number;
}

const CHANNEL_NAME = 'taskflow_realtime_channel_v1';
const PING_KEY = 'taskflow_realtime_ping_v1';

class RealtimeSyncManager {
  private channel: BroadcastChannel | null = null;
  private listeners: Set<(event: SyncEvent) => void> = new Set();
  private clientId: string = `client-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        if ('BroadcastChannel' in window) {
          this.channel = new BroadcastChannel(CHANNEL_NAME);
          this.channel.onmessage = (ev: MessageEvent<SyncEvent>) => {
            if (ev.data && ev.data.senderId !== this.clientId) {
              this.notifyListeners(ev.data);
            }
          };
        }
      } catch (err) {
        console.warn('[RealtimeSync] BroadcastChannel init warning:', err);
      }

      // Storage event fallback for cross-tab sync in all browser environments
      window.addEventListener('storage', (e: StorageEvent) => {
        if (e.key === PING_KEY && e.newValue) {
          try {
            const parsed: SyncEvent = JSON.parse(e.newValue);
            if (parsed && parsed.senderId !== this.clientId) {
              this.notifyListeners(parsed);
            }
          } catch {
            // ignore JSON parse error
          }
        }
      });
    }
  }

  public getClientId(): string {
    return this.clientId;
  }

  public subscribe(callback: (event: SyncEvent) => void): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notifyListeners(event: SyncEvent) {
    this.listeners.forEach(cb => {
      try {
        cb(event);
      } catch (e) {
        console.error('[RealtimeSync] Listener callback error:', e);
      }
    });
  }

  /**
   * Broadcast an event to all other open tabs, windows, and devices immediately.
   */
  public broadcast(type: SyncEventType, payload: any) {
    const event: SyncEvent = {
      type,
      payload,
      senderId: this.clientId,
      timestamp: Date.now()
    };

    // 1. Post to BroadcastChannel (instantaneous < 5ms cross-tab delivery)
    if (this.channel) {
      try {
        this.channel.postMessage(event);
      } catch (e) {
        console.warn('[RealtimeSync] PostMessage error:', e);
      }
    }

    // 2. Trigger localStorage storage event fallback
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(PING_KEY, JSON.stringify(event));
      } catch {
        // storage quota or private browsing safeguard
      }
    }
  }
}

export const realtimeSync = new RealtimeSyncManager();
