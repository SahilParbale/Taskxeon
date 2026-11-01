import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { PresenceStatus } from '../../types';
import { PresenceBadge } from '../common/PresenceBadge';
import { GlobalSearchModal } from '../common/GlobalSearchModal';
import { NotificationDropdown } from '../common/NotificationDropdown';
import {
  Search,
  ChevronDown,
  Menu,
  RefreshCw,
  Plus,
  UserPlus,
  Database,
  LogOut
} from 'lucide-react';

export const Header: React.FC<{ onMobileMenuClick: () => void }> = ({ onMobileMenuClick }) => {
  const {
    currentUser,
    setUserPresence,
    setIsCreateModalOpen,
    setIsCreateProjectModalOpen,
    setIsCreateEmployeeModalOpen,
    resetAllData,
    openConfirmModal,
    setCurrentView,
    supabaseStatus,
    supabaseLatencyMs,
    syncWithSupabase,
    logout
  } = useApp();

  const [isPresenceOpen, setIsPresenceOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const presenceRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close popovers on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (presenceRef.current && !presenceRef.current.contains(e.target as Node)) {
        setIsPresenceOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-30 h-16 border-b border-slate-200/80 bg-white/95 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between gap-4">
        {/* Left: Mobile Toggle & Search */}
        <div className="flex items-center gap-3 flex-1 max-w-md">
          <button
            onClick={onMobileMenuClick}
            className="lg:hidden p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Search trigger button */}
          <button
            onClick={() => setIsSearchOpen(true)}
            className="w-full max-w-xs flex items-center justify-between px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50/70 text-slate-400 hover:border-slate-300 hover:bg-slate-100/80 transition-all text-xs"
          >
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-slate-400" />
              <span>Search tasks, projects...</span>
            </div>
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-white rounded border border-slate-200 text-slate-500">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Supabase Cloud Sync Status Pill */}
        <div
          onClick={() => syncWithSupabase()}
          className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50/80 hover:bg-slate-100 cursor-pointer text-xs transition-all shadow-soft-sm"
          title={
            supabaseStatus === 'connected'
              ? `Connected to Supabase Cloud (${supabaseLatencyMs}ms). Click to re-sync.`
              : supabaseStatus === 'needs_migration'
              ? 'Supabase reachable! Run supabase/schema.sql in your Supabase SQL Editor to enable table syncing.'
              : 'Supabase offline or unreachable. Click to retry connection.'
          }
        >
          <Database
            className={`w-3.5 h-3.5 ${
              supabaseStatus === 'connected'
                ? 'text-emerald-600'
                : supabaseStatus === 'needs_migration'
                ? 'text-amber-600'
                : 'text-slate-400'
            }`}
          />
          <span className="text-[11px] font-semibold text-slate-700">
            {supabaseStatus === 'connected' && `Cloud Synced (${supabaseLatencyMs}ms)`}
            {supabaseStatus === 'connecting' && 'Connecting...'}
            {supabaseStatus === 'needs_migration' && 'Supabase (Setup Schema)'}
            {supabaseStatus === 'disconnected' && 'Local Mode'}
          </span>
          <span
            className={`w-2 h-2 rounded-full ${
              supabaseStatus === 'connected'
                ? 'bg-emerald-500 animate-pulse'
                : supabaseStatus === 'needs_migration'
                ? 'bg-amber-500'
                : supabaseStatus === 'connecting'
                ? 'bg-blue-500 animate-pulse'
                : 'bg-slate-300'
            }`}
          />
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Quick Create CTAs (Manager role only) */}
          {currentUser.role === 'manager' && (
            <div className="hidden sm:flex items-center gap-1.5">
              <button
                onClick={() => setIsCreateEmployeeModalOpen(true)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg transition-all"
                title="Onboard New Team Member"
              >
                <UserPlus className="w-3.5 h-3.5 text-emerald-600" />
                <span>Employee</span>
              </button>
              <button
                onClick={() => setIsCreateProjectModalOpen(true)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-lg transition-all"
                title="Create New Project Initiative"
              >
                <Plus className="w-3.5 h-3.5 text-emerald-600" />
                <span>Project</span>
              </button>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm hover:shadow transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Assign Task</span>
              </button>
            </div>
          )}

          {/* Presence Selector Dropdown (Employees only) */}
          {currentUser.role !== 'manager' && (
            <div className="relative" ref={presenceRef}>
              <button
                onClick={() => setIsPresenceOpen(!isPresenceOpen)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/30 transition-all text-xs font-semibold text-slate-700 shadow-2xs cursor-pointer"
                title="Change your presence"
              >
                <PresenceBadge status={currentUser.presence} variant="dot" size="md" />
                <span className="hidden sm:inline-block capitalize">{currentUser.presence === 'break' ? 'On Break' : currentUser.presence}</span>
                <ChevronDown className="w-3.5 h-3.5 text-emerald-600 transition-transform" />
              </button>

              {isPresenceOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-2xl theme-dropdown-menu p-2 z-50 text-xs">
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
          )}

          {/* Notification Bell with Ringing Chimes & Unread Counter */}
          <NotificationDropdown align="right" />

          {/* Profile Dropdown */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-2 p-1 rounded-full hover:ring-2 hover:ring-emerald-500/30 transition-all cursor-pointer"
            >
              <div className="relative">
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-8 h-8 rounded-full object-cover ring-2 ring-emerald-500/20"
                />
                {currentUser.role !== 'manager' && (
                  <span className="absolute -bottom-0.5 -right-0.5">
                    <PresenceBadge status={currentUser.presence} variant="dot" size="sm" />
                  </span>
                )}
              </div>
            </button>

            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-72 max-w-[calc(100vw-24px)] rounded-2xl theme-dropdown-menu p-2.5 z-50 text-xs">
                {/* User card in menu */}
                <div className="p-3.5 bg-gradient-to-br from-emerald-50/90 via-white to-slate-50 rounded-xl mb-1.5 border border-emerald-100/80 shadow-2xs">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-bold text-slate-900 text-sm">{currentUser.name}</p>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] uppercase border border-emerald-200">
                      {currentUser.role}
                    </span>
                  </div>
                  <p className="text-slate-500 text-[11px] truncate">{currentUser.email}</p>
                  {currentUser.role !== 'manager' && (
                    <div className="mt-2.5 pt-2 border-t border-emerald-100/50 flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Current Status</span>
                      <PresenceBadge status={currentUser.presence} variant="pill" size="sm" />
                    </div>
                  )}
                </div>

                <div className="py-1 space-y-0.5">
                  <button
                    onClick={() => {
                      setIsProfileOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-amber-700 hover:bg-amber-50 font-semibold transition-all"
                  >
                    <LogOut className="w-4 h-4 text-amber-600" />
                    <span>Sign Out</span>
                  </button>

                  <div className="my-1 border-t border-slate-100" />

                  <button
                    onClick={() => {
                      setIsProfileOpen(false);
                      openConfirmModal({
                        title: 'Clear All Data (Clean Slate)',
                        message: 'Are you sure you want to clear all tasks, projects, and messages? This will reset the workspace to a clean production state.',
                        confirmText: 'Clear All Data',
                        confirmVariant: 'danger',
                        onConfirm: () => {
                          resetAllData();
                        }
                      });
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 font-medium transition-all"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Clear All Data (Clean Slate)</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Global Search Modal */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
    </>
  );
};
