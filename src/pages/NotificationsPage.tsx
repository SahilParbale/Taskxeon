import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { NotificationType } from '../types';
import {
  Bell,
  CheckCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  AlertTriangle,
  Info,
  ArrowRight
} from 'lucide-react';

export const NotificationsPage: React.FC = () => {
  const {
    userNotifications,
    unreadCount,
    markNotificationRead,
    markAllNotificationsRead,
    setSelectedTaskId
  } = useApp();

  const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | 'assignment' | 'completion'>('all');

  const filtered = userNotifications.filter(n => {
    if (activeFilter === 'unread') return !n.read;
    if (activeFilter === 'assignment') return n.type === 'assignment';
    if (activeFilter === 'completion') return n.type === 'completion';
    return true;
  });

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case 'assignment':
        return <Sparkles className="w-4 h-4 text-emerald-600" />;
      case 'completion':
        return <CheckCircle2 className="w-4 h-4 text-emerald-700" />;
      case 'overdue':
        return <AlertTriangle className="w-4 h-4 text-rose-600" />;
      default:
        return <Info className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Notifications Center
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Role-tailored assignment alerts, task milestones, and sprint status changes.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={markAllNotificationsRead}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold border border-emerald-200 transition-colors"
          >
            <CheckCheck className="w-4 h-4" />
            Mark all {unreadCount} read
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-2 overflow-x-auto text-xs font-semibold">
        {(['all', 'unread', 'assignment', 'completion'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveFilter(tab)}
            className={`px-3 py-1.5 rounded-lg capitalize transition-colors ${
              activeFilter === tab
                ? 'bg-slate-900 text-white font-bold'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {tab === 'unread' ? `Unread (${unreadCount})` : tab}
          </button>
        ))}
      </div>

      {/* Notification Cards */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-soft divide-y divide-slate-100 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-800">All caught up</h3>
            <p className="text-xs text-slate-400 mt-1">No notifications matching selected filter.</p>
          </div>
        ) : (
          filtered.map(notif => (
            <div
              key={notif.id}
              onClick={() => {
                markNotificationRead(notif.id);
                if (notif.taskId) setSelectedTaskId(notif.taskId);
              }}
              className={`p-4 flex items-start gap-4 transition-colors cursor-pointer group ${
                !notif.read ? 'bg-emerald-50/30 hover:bg-emerald-50/60' : 'hover:bg-slate-50'
              }`}
            >
              <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-soft-sm group-hover:border-emerald-300">
                {getIcon(notif.type)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className={`text-xs font-bold ${!notif.read ? 'text-slate-900' : 'text-slate-700'}`}>
                    {notif.title}
                  </h4>
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(notif.createdAt).toLocaleDateString([], {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">{notif.message}</p>
                {notif.taskId && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 mt-2 group-hover:underline">
                    View linked deliverable <ArrowRight className="w-3 h-3" />
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
