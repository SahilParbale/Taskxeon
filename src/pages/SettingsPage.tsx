import React from 'react';
import { useApp } from '../context/AppContext';
import { RoleBadge } from '../components/common/RoleBadge';
import { PresenceBadge } from '../components/common/PresenceBadge';
import { PresenceStatus } from '../types';
import {
  Settings,
  User,
  Shield,
  RefreshCw,
  Sparkles,
  Layers,
  ArrowRightLeft,
  LogOut
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const {
    currentUser,
    setUserPresence,
    resetAllData,
    openConfirmModal,
    supabaseStatus,
    supabaseLatencyMs,
    syncWithSupabase,
    logout
  } = useApp();

  return (
    <div className="py-6 px-4 sm:px-8 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Settings & Demo Controls</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Manage your profile persona, real-time presence preferences, and demo environment state.
        </p>
      </div>

      {/* User Profile Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-soft space-y-6">
        <div className="flex items-start justify-between pb-6 border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className="relative">
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-16 h-16 rounded-2xl object-cover ring-2 ring-slate-100 shadow-soft"
              />
              {currentUser.role !== 'manager' && (
                <span className="absolute -bottom-1 -right-1">
                  <PresenceBadge status={currentUser.presence} variant="dot" size="md" />
                </span>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">{currentUser.name}</h2>
                <RoleBadge role={currentUser.role} />
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-slate-500">{currentUser.email}</span>
                <span className="text-slate-300">•</span>
                <span className="text-[11px] font-mono font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/60">
                  @{currentUser.username || currentUser.email.split('@')[0]}
                </span>
              </div>
              <p className="text-xs text-emerald-800 font-semibold mt-1">
                {currentUser.title} &bull; {currentUser.department}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => logout()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/60 text-xs font-semibold transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </div>
        </div>

        {/* Presence Setting */}
        {currentUser.role !== 'manager' ? (
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Default Presence Status
            </label>
            <div className="grid grid-cols-3 gap-3 max-w-md">
              {(['online', 'break', 'offline'] as PresenceStatus[]).map(st => (
                <button
                  key={st}
                  onClick={() => setUserPresence(st)}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 capitalize transition-all ${
                    currentUser.presence === st
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-600/20 shadow-sm'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <PresenceBadge status={st} variant="dot" size="sm" />
                  <span>{st === 'break' ? 'On Break' : st}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 max-w-md">
            <span className="text-xs font-bold text-slate-700 block mb-1">
              Manager Role Availability
            </span>
            <p className="text-xs text-slate-500">
              Managers oversee team operations. Real-time availability indicators are tracked for individual team employees.
            </p>
          </div>
        )}
      </div>

      {/* Supabase Cloud Database Management */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-soft space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Supabase Cloud Database</h3>
              <p className="text-[11px] text-slate-500">Project Reference: <code className="bg-slate-100 px-1 py-0.5 rounded text-[10px] font-mono text-emerald-800">kgkggknznzumdhujsilj</code></p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 border ${
                supabaseStatus === 'connected'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : supabaseStatus === 'needs_migration'
                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                  : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  supabaseStatus === 'connected'
                    ? 'bg-emerald-500 animate-pulse'
                    : supabaseStatus === 'needs_migration'
                    ? 'bg-amber-500'
                    : 'bg-slate-400'
                }`}
              />
              {supabaseStatus === 'connected' && `Online (${supabaseLatencyMs}ms)`}
              {supabaseStatus === 'connecting' && 'Testing...'}
              {supabaseStatus === 'needs_migration' && 'Awaiting Schema Setup'}
              {supabaseStatus === 'disconnected' && 'Local Offline Cache'}
            </span>

            <button
              onClick={() => syncWithSupabase()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-soft-sm transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5 text-emerald-600" />
              Sync Now
            </button>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs text-slate-600">
          <p className="font-semibold text-slate-800">SQL Schema Migration:</p>
          <p className="text-slate-500 leading-relaxed">
            The full database schema script is available in <code className="bg-white px-1.5 py-0.5 rounded border border-slate-200 text-emerald-800 font-mono text-[11px]">supabase/schema.sql</code>.
            Copy and paste its contents into your <strong>Supabase Dashboard &rarr; SQL Editor</strong> and click <strong>Run</strong> to create all tables (<code className="font-mono text-[10px]">users</code>, <code className="font-mono text-[10px]">projects</code>, <code className="font-mono text-[10px]">tasks</code>, <code className="font-mono text-[10px]">activity_logs</code>, <code className="font-mono text-[10px]">notifications</code>) with full RLS policies and Realtime enabled.
          </p>
        </div>
      </div>

      {/* Demo Environment Management */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-soft space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <Sparkles className="w-4 h-4 text-emerald-600" />
          <h3 className="text-sm font-bold text-slate-900">Demo State & Data Controls</h3>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed max-w-xl">
          All modifications, task completions, and created items are persisted locally during this session.
          If you need to reset the app to the pristine factory demo state for another demonstration, click below:
        </p>

        <div className="pt-2">
          <button
            onClick={() => {
              openConfirmModal({
                title: 'Reset Demo Data',
                message: 'Reset all TaskFlow data to factory demo state? All custom tasks, leads, and status changes will be reset to defaults.',
                confirmText: 'Reset Demo Data',
                confirmVariant: 'danger',
                onConfirm: () => {
                  resetAllData();
                }
              });
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold transition-colors cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            Reset All Data to Initial Demo State
          </button>
        </div>
      </div>
    </div>
  );
};
