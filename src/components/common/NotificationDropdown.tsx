import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  getSystemNotificationPermission,
  requestSystemNotificationPermission,
  dispatchSystemNotification,
  NotificationPermissionStatus
} from '../../lib/notifications';
import {
  Bell,
  CheckCheck,
  CheckSquare,
  CheckCircle2,
  Users,
  MessageSquare,
  Clock,
  Sparkles,
  ShieldAlert,
  Laptop
} from 'lucide-react';

export const NotificationDropdown: React.FC<{
  className?: string;
  align?: 'left' | 'right';
}> = ({
  className = '',
  align = 'right'
}) => {
  const {
    notifications,
    currentUser,
    markNotificationRead,
    markAllNotificationsRead,
    setSelectedTaskId,
    setSelectedProjectId,
    setCurrentView,
    openChatWithUser,
    addToast
  } = useApp();

  const [isOpen, setIsOpen] = useState(false);
  const [permission, setPermission] = useState<NotificationPermissionStatus>(() => getSystemNotificationPermission());
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sync latest browser permission state when popover opens
  useEffect(() => {
    if (isOpen) {
      setPermission(getSystemNotificationPermission());
    }
  }, [isOpen]);

  // Filter notifications specifically for the logged-in user
  const userNotifications = notifications.filter(
    n => n.userId === currentUser.id || !n.userId
  );
  const unreadCount = userNotifications.filter(n => !n.read).length;

  // Handle outside click to close popover
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleRequestPermission = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const newPerm = await requestSystemNotificationPermission();
    setPermission(newPerm);
    if (newPerm === 'granted') {
      await dispatchSystemNotification('TaskFlow Notifications Enabled 🎉', {
        body: 'System notifications and default OS ring sounds are now active for your workspace.'
      });
      addToast('System Notifications Active! 🔔', 'Default OS notification banner and ring chime enabled.', 'success');
    } else if (newPerm === 'denied') {
      addToast('Notifications Blocked', 'Please enable notifications in your browser address bar site settings.', 'warning');
    }
  };

  const handleTestSystemNotification = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const result = await dispatchSystemNotification('TaskFlow Alert 🔔', {
      body: `System notification received for ${currentUser.name}. Default OS ring & toast alert active!`,
      tag: 'taskflow-system-test'
    });
    setPermission(result);
    if (result === 'granted') {
      addToast('System Notification Sent 🔔', 'Triggered OS notification banner with default system sound.', 'success');
    } else if (result === 'denied') {
      addToast('System Permission Blocked', 'Please allow notifications in your browser site settings.', 'warning');
    }
  };

  const handleNotificationClick = (notif: (typeof notifications)[0]) => {
    markNotificationRead(notif.id);
    if (notif.taskId) {
      setSelectedTaskId(notif.taskId);
    } else if (notif.projectId) {
      setSelectedProjectId(notif.projectId);
      setCurrentView('project_detail');
    } else if (notif.type === 'message' && notif.senderId) {
      openChatWithUser(notif.senderId);
    } else if (notif.type === 'system' || notif.type === 'message') {
      setCurrentView('messages');
    }
    setIsOpen(false);
  };

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'assignment':
        return <CheckSquare className="w-4 h-4 text-emerald-600" />;
      case 'completion':
        return <CheckCircle2 className="w-4 h-4 text-teal-600" />;
      case 'reassignment':
        return <Users className="w-4 h-4 text-blue-600" />;
      case 'overdue':
        return <Clock className="w-4 h-4 text-rose-600" />;
      default:
        return <MessageSquare className="w-4 h-4 text-emerald-600" />;
    }
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Trigger Bell Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
        title="System Notifications & Alerts"
        aria-label="View notifications"
      >
        <Bell className={`w-5 h-5 ${unreadCount > 0 ? 'text-emerald-700' : ''}`} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white shadow-xs animate-in zoom-in-50">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Card */}
      {isOpen && (
        <div
          className={`absolute mt-2 w-[340px] sm:w-96 max-w-[calc(100vw-24px)] rounded-2xl bg-white shadow-2xl border border-emerald-100/90 text-xs overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 ${
            align === 'left' ? 'left-0' : 'right-0'
          }`}
          style={{
            boxShadow: '0 20px 40px -10px rgba(6, 78, 59, 0.16), 0 10px 15px -3px rgba(6, 78, 59, 0.08)'
          }}
        >
          {/* Header Bar */}
          <div className="p-3.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 text-sm">Notifications</span>
              {unreadCount > 0 ? (
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                  {unreadCount} new
                </span>
              ) : (
                <span className="text-[11px] text-slate-400">All caught up</span>
              )}
            </div>

            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllNotificationsRead}
                  className="p-1.5 rounded-lg hover:bg-slate-200/60 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                  title="Mark all as read"
                >
                  <CheckCheck className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* System Notification Status & OS Test Action */}
          <div className="px-3.5 py-2.5 bg-gradient-to-r from-emerald-50/80 to-teal-50/50 border-b border-emerald-100/60 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <Laptop className="w-4 h-4 text-emerald-700 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-emerald-950 truncate">
                  Default System Notifications
                </p>
                <p className="text-[10px] text-emerald-700 truncate">
                  {permission === 'granted'
                    ? 'Active (Plays OS default ring sound)'
                    : 'Requires system permission'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleTestSystemNotification}
              className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-2xs transition-all active:scale-95 cursor-pointer flex-shrink-0 flex items-center gap-1"
              title="Trigger a test native system notification with OS ringtone"
            >
              <Bell className="w-3.5 h-3.5" />
              <span>Test Alert</span>
            </button>
          </div>

          {/* System Permission Banner if not granted */}
          {permission !== 'granted' && (
            <div className="p-3 bg-amber-50 border-b border-amber-200/80 flex items-center justify-between gap-2 text-amber-900">
              <div className="flex items-center gap-2 min-w-0">
                <ShieldAlert className="w-4 h-4 text-amber-700 flex-shrink-0" />
                <p className="text-[11px] leading-tight font-medium">
                  {permission === 'denied'
                    ? 'System notifications blocked in browser settings'
                    : 'Enable OS push notifications & ring sound'}
                </p>
              </div>
              {permission !== 'denied' ? (
                <button
                  type="button"
                  onClick={handleRequestPermission}
                  className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-[10px] flex-shrink-0 transition-colors cursor-pointer"
                >
                  Enable
                </button>
              ) : (
                <span className="text-[9px] text-amber-800 font-semibold uppercase tracking-wider">
                  Blocked
                </span>
              )}
            </div>
          )}

          {/* Notifications Feed */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
            {userNotifications.length === 0 ? (
              <div className="p-8 text-center text-slate-400 space-y-2">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-100 shadow-2xs">
                  <Bell className="w-5 h-5 text-emerald-600" />
                </div>
                <p className="text-xs font-bold text-slate-700">No notifications yet</p>
                <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                  Task assignments, project updates, and team mentions will ring and notify here through your system notification center.
                </p>
              </div>
            ) : (
              userNotifications.map(notif => (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`p-3.5 flex items-start gap-3 hover:bg-slate-50 transition-colors cursor-pointer group ${
                    !notif.read ? 'bg-emerald-50/30' : ''
                  }`}
                >
                  <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-2xs">
                    {getNotifIcon(notif.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <p className={`text-xs font-bold truncate ${!notif.read ? 'text-slate-900' : 'text-slate-700'}`}>
                        {notif.title}
                      </p>
                      {!notif.read && (
                        <span className="w-2 h-2 rounded-full bg-emerald-600 flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                      {notif.message}
                    </p>
                    <span className="text-[10px] text-slate-400 mt-1 block font-medium">
                      {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
