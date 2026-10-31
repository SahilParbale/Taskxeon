import React from 'react';
import { useApp } from '../../context/AppContext';
import { ViewType } from '../../types';
import { RoleBadge } from '../common/RoleBadge';
import { PresenceBadge } from '../common/PresenceBadge';
import { triggerHaptic } from '../../lib/pwa';
import {
  Layers,
  LayoutDashboard,
  CheckSquare,
  FolderKanban,
  Users,
  MessageSquare,
  X
} from 'lucide-react';

export const MobileDrawer: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onOpenInstallModal?: () => void;
}> = ({
  isOpen,
  onClose,
  onOpenInstallModal
}) => {
  const {
    currentUser,
    currentView,
    setCurrentView,
    logout,
    setUserPresence,
    supabaseStatus,
    supabaseLatencyMs
  } = useApp();

  if (!isOpen) return null;

  const navLinks: { id: ViewType; label: string; icon: React.ReactNode; hidden?: boolean }[] = [
    { id: 'dashboard', label: 'Overview', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'tasks', label: 'Tasks', icon: <CheckSquare className="w-5 h-5" /> },
    { id: 'projects', label: 'Projects', icon: <FolderKanban className="w-5 h-5" /> },
    { id: 'team', label: currentUser.role === 'manager' ? 'My Team' : 'Team & Presence', icon: <Users className="w-5 h-5" /> },
    { id: 'messages', label: 'Messages', icon: <MessageSquare className="w-5 h-5" /> }
  ];

  return (
    <div className="fixed inset-0 z-50 lg:hidden overflow-hidden">
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />

      <div className="fixed inset-y-0 left-0 max-w-xs w-full bg-white shadow-2xl flex flex-col z-50">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-700 flex items-center justify-center text-white">
              <Layers className="w-4 h-4" />
            </div>
            <span className="font-extrabold text-slate-900 text-sm">TaskFlow</span>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Card */}
        <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <img src={currentUser.avatar} alt={currentUser.name} className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
            <div className="min-w-0 truncate">
              <p className="text-xs font-bold text-slate-900 truncate">{currentUser.name}</p>
              <p className="text-[10px] text-slate-500 truncate">{currentUser.title}</p>
            </div>
          </div>
          {currentUser.role !== 'manager' ? (
            <PresenceBadge status={currentUser.presence} variant="pill" size="sm" />
          ) : (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 uppercase tracking-wider flex-shrink-0">
              Manager
            </span>
          )}
        </div>

        {/* Presence Selector for Employees on Mobile */}
        {currentUser.role !== 'manager' && (
          <div className="p-3 bg-white border-b border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5 px-1">
              Set Availability
            </span>
            <div className="grid grid-cols-3 gap-1">
              {(['online', 'break', 'offline'] as const).map(st => (
                <button
                  key={st}
                  onClick={() => setUserPresence(st)}
                  className={`py-1 rounded-lg text-[11px] font-semibold capitalize transition-all cursor-pointer ${
                    currentUser.presence === st
                      ? 'bg-emerald-600 text-white shadow-2xs font-bold'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/60'
                  }`}
                >
                  {st === 'break' ? 'Break' : st}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Nav Items */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {navLinks
            .filter(n => !n.hidden)
            .map(item => {
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setCurrentView(item.id);
                    onClose();
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span className={isActive ? 'text-emerald-700' : 'text-slate-400'}>{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              );
            })}
        </div>

        {/* Drawer Footer: Status & Logout */}
        <div className="p-3 border-t border-slate-100 bg-slate-50 space-y-2">
          <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
            <span className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${supabaseStatus === 'connected' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
              <span>{supabaseStatus === 'connected' ? `Synced (${supabaseLatencyMs}ms)` : 'Local Mode'}</span>
            </span>
            <span className="font-semibold text-emerald-800 uppercase text-[10px]">{currentUser.role}</span>
          </div>

          <button
            onClick={() => {
              onClose();
              logout();
            }}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-rose-200 bg-rose-50/70 hover:bg-rose-100 text-rose-700 text-xs font-semibold transition-colors cursor-pointer"
          >
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export const MobileBottomBar: React.FC = () => {
  const { currentView, setCurrentView } = useApp();

  const tabs: { id: ViewType; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Overview', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'tasks', label: 'Tasks', icon: <CheckSquare className="w-5 h-5" /> },
    { id: 'projects', label: 'Projects', icon: <FolderKanban className="w-5 h-5" /> },
    { id: 'team', label: 'Team', icon: <Users className="w-5 h-5" /> },
    { id: 'messages', label: 'Chat', icon: <MessageSquare className="w-5 h-5" /> }
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 px-1 pt-1 pb-[max(env(safe-area-inset-bottom),0.35rem)] flex items-center justify-around shadow-lg">
      {tabs.map(tab => {
        const active = currentView === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => {
              triggerHaptic('light');
              setCurrentView(tab.id);
            }}
            className={`flex flex-col items-center gap-0.5 py-1 px-2.5 sm:px-3 rounded-lg text-[10px] font-semibold transition-all cursor-pointer ${
              active ? 'text-emerald-700 scale-105 font-bold' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            {tab.icon}
            <span className="leading-tight">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
