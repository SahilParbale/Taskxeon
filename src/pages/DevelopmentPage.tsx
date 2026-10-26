import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Terminal,
  ShieldAlert,
  Server,
  GitBranch,
  PlayCircle,
  CheckCircle2,
  AlertOctagon,
  RefreshCw,
  Cpu,
  Database,
  Radio,
  ArrowRight,
  Filter,
  Lock
} from 'lucide-react';

export const DevelopmentPage: React.FC = () => {
  const { currentUser, setCurrentView, devPipelines, devLogs } = useApp();

  const [logFilter, setLogFilter] = useState<'all' | 'error' | 'warn' | 'info' | 'success'>('all');

  // RBAC Guard
  const isAuthorized = currentUser.role === 'manager';

  if (!isAuthorized) {
    return (
      <div className="p-6 max-w-2xl mx-auto my-12 text-center">
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-soft-md">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8" />
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 uppercase tracking-wider">
            RBAC Access Denied
          </span>
          <h2 className="text-xl font-bold text-slate-900 mt-3 mb-2">
            Development Workspace Protected
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed mb-6 max-w-md mx-auto">
            You are currently logged in as <strong>{currentUser.name}</strong> ({currentUser.role}).
            Production deployment metrics, pipeline controls, and technical infrastructure logs are
            restricted to Operations Manager clearance.
          </p>

          <button
            onClick={() => setCurrentView('dashboard')}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-sm transition-all max-w-xs mx-auto"
          >
            <span>Return to Workspace Overview</span>
          </button>
        </div>
      </div>
    );
  }

  const filteredLogs = devLogs.filter(log => {
    if (logFilter === 'all') return true;
    return log.level === logFilter;
  });

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-200 flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5" />
              DevOps & Telemetry
            </span>
            <span className="text-xs text-slate-400 font-mono">cluster: us-east-1-prod</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Development Workspace
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Real-time infrastructure health, CI/CD pipeline builds, and distributed system service logs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            All Systems Operational
          </span>
        </div>
      </div>

      {/* Telemetry Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-soft">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Service Uptime</span>
            <Server className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900 tabular-nums">99.98%</p>
          <span className="text-[11px] text-emerald-700 font-medium">SLA: 99.95% (Exceeded)</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-soft">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">API p95 Latency</span>
            <Cpu className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900 tabular-nums">42ms</p>
          <span className="text-[11px] text-slate-400">Target: &lt;100ms</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-soft">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Error Rate</span>
            <AlertOctagon className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900 tabular-nums">0.012%</p>
          <span className="text-[11px] text-emerald-700 font-medium">Within safe boundaries</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-soft">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Pods</span>
            <Database className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900 tabular-nums">24 / 24</p>
          <span className="text-[11px] text-slate-400">Auto-scaler idle</span>
        </div>
      </div>

      {/* CI/CD Deployment Pipelines */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-soft overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-indigo-600" />
            <h3 className="font-bold text-slate-900 text-sm">Active CI/CD Build Pipelines</h3>
          </div>
          <span className="text-xs text-slate-400">GitHub Actions &bull; KubeRunner</span>
        </div>

        <div className="divide-y divide-slate-100">
          {devPipelines.map(pipe => {
            const statusConfig = {
              success: {
                badge: 'bg-emerald-50 text-emerald-800 border-emerald-200',
                icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />,
                label: 'Passed'
              },
              running: {
                badge: 'bg-blue-50 text-blue-800 border-blue-200',
                icon: <RefreshCw className="w-3.5 h-3.5 text-blue-600 animate-spin" />,
                label: 'Building'
              },
              failed: {
                badge: 'bg-rose-50 text-rose-800 border-rose-200',
                icon: <AlertOctagon className="w-3.5 h-3.5 text-rose-600" />,
                label: 'Failed'
              }
            }[pipe.status];

            return (
              <div key={pipe.id} className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-slate-50 transition-colors">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="mt-1">{statusConfig.icon}</div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-xs">{pipe.name}</span>
                      <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                        {pipe.branch}
                      </span>
                      <span className="font-mono text-[10px] text-slate-400">{pipe.commit}</span>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">{pipe.commitMsg}</p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Triggered by <strong>{pipe.author}</strong> &bull; {pipe.timestamp}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center">
                  <span className="text-xs text-slate-500 font-mono">{pipe.duration}</span>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border flex items-center gap-1 ${statusConfig.badge}`}>
                    {statusConfig.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Technical Log Stream */}
      <div className="bg-slate-950 text-slate-300 rounded-2xl p-5 border border-slate-800 shadow-xl font-mono text-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-white font-bold tracking-wider">LIVE LOG STREAM</span>
            <span className="text-[10px] text-slate-500">tail -f /var/log/taskflow/*.log</span>
          </div>

          <div className="flex items-center gap-1.5">
            {(['all', 'info', 'warn', 'error', 'success'] as const).map(lvl => (
              <button
                key={lvl}
                onClick={() => setLogFilter(lvl)}
                className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold transition-all ${
                  logFilter === lvl
                    ? 'bg-slate-800 text-emerald-400 border border-slate-700'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 space-y-2.5 max-h-72 overflow-y-auto">
          {filteredLogs.map(log => {
            const levelColor = {
              info: 'text-blue-400',
              warn: 'text-amber-400',
              error: 'text-rose-400 font-bold',
              success: 'text-emerald-400'
            }[log.level];

            return (
              <div key={log.id} className="flex items-start gap-3 hover:bg-slate-900/60 p-1 rounded transition-colors">
                <span className="text-slate-500 text-[10px] flex-shrink-0">{log.timestamp}</span>
                <span className={`text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-slate-900 border border-slate-800 ${levelColor} flex-shrink-0`}>
                  {log.level}
                </span>
                <span className="text-slate-400 text-[11px] flex-shrink-0">[{log.service}]</span>
                <span className="text-slate-200 flex-1 break-words">{log.message}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
