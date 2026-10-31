import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { ViewType, PresenceStatus } from '../../types';
import { PresenceBadge } from '../common/PresenceBadge';
import { NotificationDropdown } from '../common/NotificationDropdown';
import {
  Layers,
  LayoutDashboard,
  CheckSquare,
  FolderKanban,
  Users,
  MessageSquare,
  LogOut,
  Search,
  ChevronDown
} from 'lucide-react';

export const Sidebar: React.FC<{ onOpenInstallModal?: () => void }> = () => {
  const {
    currentUser,
    currentView,
    setCurrentView,
    tasks,
    projects,
    users,
    logout,
    setIsSearchOpen,
    setUserPresence
  } = useApp();

  const [isPresenceOpen, setIsPresenceOpen] = useState(false);
  const presenceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (presenceRef.current && !presenceRef.current.contains(e.target as Node)) {
        setIsPresenceOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const onlineCount = users.filter(u => u.presence === 'online').length;

  const navItems: {
    id: ViewType;
    label: string;
    icon: React.ReactNode;
    badge?: string | number;
    badgeColor?: string;
    hidden?: boolean;
    isProtected?: boolean;
  }[] = [
    {
      id: 'dashboard',
      label: 'Overview',
      icon: <LayoutDashboard className="w-4 h-4" />
    },
    {
      id: 'tasks',
      label: currentUser.role === 'employee' ? 'My Tasks' : 'All Tasks',
      icon: <CheckSquare className="w-4 h-4" />,
      badge: (currentUser.role === 'employee'
        ? tasks.filter(t => t.assigneeId === currentUser.id && t.status !== 'completed')
        : tasks.filter(t => t.status !== 'completed')
      ).length
    },
    {
      id: 'projects',
      label: currentUser.role === 'employee' ? 'My Projects' : 'Projects',
      icon: <FolderKanban className="w-4 h-4" />,
      badge: (currentUser.role === 'employee'
        ? projects.filter(p => p.members.includes(currentUser.id)).length
        : projects.length)
    },
    {
      id: 'team',
      label: currentUser.role === 'manager' ? 'My Team' : 'Team & Presence',
      icon: <Users className="w-4 h-4" />,
      badge: `${onlineCount} Online`,
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200'
    },
    {
      id: 'messages',
      label: 'Messages',
      icon: <MessageSquare className="w-4 h-4" />
    }
  ];

  return (
    <aside className="hidden lg:flex w-64 flex-col border-r border-slate-200 bg-white select-none">
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-5 border-b border-slate-100 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-800 flex items-center justify-center text-white shadow-soft">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-slate-900 tracking-tight text-base">
                TaskFlow
              </span>
              <span className="px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-bold text-[9px] uppercase tracking-wider">
                Enterprise
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium">Corporate Task Orchestration</p>
          </div>
        </div>

        {/* Real-time Notifications Bell with Ring & Sound Settings */}
        <NotificationDropdown align="left" />
      </div>

      {/* Quick Search Bar */}
      <div className="px-3 pt-3 pb-1 flex-shrink-0">
        <button
          onClick={() => setIsSearchOpen(true)}
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl border border-slate-200/90 bg-slate-50/80 text-slate-500 hover:bg-slate-100/90 hover:text-slate-900 hover:border-slate-300 transition-all text-xs group cursor-pointer shadow-soft-sm"
        >
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 transition-colors" />
            <span className="font-medium text-slate-500 group-hover:text-slate-800">Search workspace...</span>
          </div>
          <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-white rounded border border-slate-200 text-slate-400 group-hover:border-slate-300">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Workspaces
        </div>
        {navItems
          .filter(item => !item.hidden)
          .map(item => {
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-900 shadow-sm border border-emerald-200/60 font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className={isActive ? 'text-emerald-700' : 'text-slate-400'}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>

                {item.badge !== undefined && item.badge !== 0 && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                      item.badgeColor || 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
      </div>

      {/* User Footer Profile Card */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between relative flex-shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Avatar with Presence */}
          <div className="relative flex-shrink-0" ref={presenceRef}>
            <button
              onClick={() => currentUser.role !== 'manager' && setIsPresenceOpen(!isPresenceOpen)}
              className="relative block rounded-full focus:outline-none"
              title={currentUser.role !== 'manager' ? 'Click to change presence' : currentUser.name}
            >
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-9 h-9 rounded-full object-cover ring-2 ring-white shadow-soft-sm"
              />
              {currentUser.role !== 'manager' && (
                <span className="absolute -bottom-0.5 -right-0.5">
                  <PresenceBadge status={currentUser.presence} variant="dot" size="sm" />
                </span>
              )}
            </button>

            {/* Quick Presence Popover for Employees */}
            {isPresenceOpen && currentUser.role !== 'manager' && (
              <div className="absolute left-0 bottom-12 w-48 rounded-2xl theme-dropdown-menu p-2 z-50 text-xs">
                <div className="flex items-center justify-between px-2.5 py-1.5 mb-1 border-b border-emerald-100/60">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                    Set Availability
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                </div>
                <div className="space-y-0.5">
                  {(['online', 'break', 'offline'] as PresenceStatus[]).map(st => (
                    <button
                      key={st}
                      onClick={() => {
                        setUserPresence(st);
                        setIsPresenceOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-left transition-all ${
                        currentUser.presence === st
                          ? 'bg-emerald-50 text-emerald-950 font-bold border border-emerald-200/80 shadow-2xs'
                          : 'text-slate-700 hover:bg-emerald-50/60 hover:text-emerald-950 font-medium'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <PresenceBadge status={st} variant="dot" size="sm" />
                        <span className="capitalize">{st === 'break' ? 'On Break' : st}</span>
                      </div>
                      {currentUser.presence === st && (
                        <span className="w-2 h-2 rounded-full bg-emerald-600 ring-2 ring-emerald-200" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-900 truncate leading-tight">
              {currentUser.name}
            </p>
            <p className="text-[10px] text-slate-400 truncate">{currentUser.title}</p>
          </div>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => logout()}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
            title="Sign Out"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
};
