import React from 'react';
import { useApp } from '../../context/AppContext';
import { Role } from '../../types';
import { PresenceBadge } from './PresenceBadge';
import {
  Layers,
  ShieldCheck,
  UserCheck,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  X
} from 'lucide-react';

export const RoleSwitcherModal: React.FC = () => {
  const { isRoleSwitcherOpen, setIsRoleSwitcherOpen, users, currentUser, switchRole } = useApp();

  if (!isRoleSwitcherOpen) return null;

  const rolesConfig: {
    role: Role;
    title: string;
    description: string;
    color: string;
    badgeColor: string;
    icon: React.ReactNode;
    features: string[];
    user: (typeof users)[0] | undefined;
  }[] = [
    {
      role: 'manager',
      title: 'Manager Persona',
      description: 'Engineering and Product Operations Lead with broad oversight.',
      color: 'hover:border-emerald-500 hover:ring-2 hover:ring-emerald-500/20',
      badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      icon: <ShieldCheck className="w-5 h-5 text-emerald-700" />,
      features: [
        'Assign and reassign tasks to team members',
        'Monitor live project progress and health',
        'View team presence (Online, Break, Offline)',
        'Full activity logs and completion metrics'
      ],
      user: users.find(u => u.role === 'manager')
    },
    {
      role: 'employee',
      title: 'Employee Persona',
      description: 'Senior UI/UX Designer executing assigned deliverables.',
      color: 'hover:border-blue-500 hover:ring-2 hover:ring-blue-500/20',
      badgeColor: 'bg-blue-50 text-blue-800 border-blue-200',
      icon: <UserCheck className="w-5 h-5 text-blue-700" />,
      features: [
        'Dedicated "My Tasks" view for personal focus',
        'Set presence: Online, On Break, Offline',
        'Mark tasks complete with confetti feedback',
        'Direct project delivery & messaging'
      ],
      user: users.find(u => u.role === 'employee') || users[0]
    }
  ];

  const handleSelectRole = (role: Role) => {
    switchRole(role);
    setIsRoleSwitcherOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-md transition-opacity"
        onClick={() => setIsRoleSwitcherOpen(false)}
      />

      <div className="flex min-h-full items-center justify-center p-4 sm:p-6 text-center">
        <div className="relative w-full max-w-3xl transform rounded-3xl bg-white text-left shadow-2xl transition-all border border-slate-200/80 overflow-hidden">
          {/* Header */}
          <div className="relative bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950 px-8 py-8 text-white">
            <button
              onClick={() => setIsRoleSwitcherOpen(false)}
              className="absolute top-6 right-6 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
                <Layers className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs uppercase tracking-widest text-emerald-400 font-bold">
                  TaskFlow Enterprise Demo
                </span>
                <h2 className="text-2xl font-bold tracking-tight">Select Demo Role Persona</h2>
              </div>
            </div>

            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Experience TaskFlow from different role perspectives. Switch seamlessly to test the
              end-to-end assignment workflow, presence tracking, and real-time project progress.
            </p>

            {/* 5-Step Story Cheat Sheet */}
            <div className="mt-5 p-3.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <span className="text-xs font-semibold text-emerald-300 flex items-center gap-1.5 uppercase tracking-wider mb-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                The 5-Step Demo Flow
              </span>
              <p className="text-xs text-slate-300 leading-normal">
                1. <strong>Manager</strong> assigns a task to Alex &rarr; 2. Switch to <strong>Employee</strong> &rarr; 3. Alex sees assigned task & completes it &rarr; 4. Switch back to <strong>Manager</strong> &rarr; 5. Observe updated task status & real-time recalculation of project progress!
              </p>
            </div>
          </div>

          {/* Role Cards Grid */}
          <div className="p-8 bg-slate-50/60">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {rolesConfig.map(cfg => {
                const isCurrent = currentUser.role === cfg.role;
                return (
                  <div
                    key={cfg.role}
                    onClick={() => handleSelectRole(cfg.role)}
                    className={`relative flex flex-col justify-between rounded-2xl bg-white p-6 border transition-all cursor-pointer shadow-soft hover:shadow-soft-md group ${
                      isCurrent
                        ? 'border-emerald-600 ring-2 ring-emerald-500/20'
                        : 'border-slate-200'
                    } ${cfg.color}`}
                  >
                    {isCurrent && (
                      <span className="absolute -top-3 left-6 px-3 py-0.5 rounded-full bg-emerald-600 text-white text-[11px] font-bold tracking-wide uppercase shadow-sm">
                        Active Persona
                      </span>
                    )}

                    <div>
                      {/* Avatar & Persona info */}
                      {cfg.user && (
                        <div className="flex items-center gap-3 mb-4">
                          <div className="relative">
                            <img
                              src={cfg.user.avatar}
                              alt={cfg.user.name}
                              className="w-12 h-12 rounded-full object-cover ring-2 ring-slate-100"
                            />
                            {cfg.role !== 'manager' && (
                              <span className="absolute -bottom-0.5 -right-0.5">
                                <PresenceBadge status={cfg.user.presence} variant="dot" size="md" />
                              </span>
                            )}
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                              {cfg.user.name}
                            </h4>
                            <p className="text-xs text-slate-500">{cfg.user.title}</p>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between mb-2">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold border ${cfg.badgeColor}`}>
                          {cfg.icon}
                          {cfg.title}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                        {cfg.description}
                      </p>

                      {/* Capabilities list */}
                      <ul className="space-y-2 mb-6">
                        {cfg.features.map((feat, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-xs text-slate-600">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <button
                      type="button"
                      className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                        isCurrent
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-700 hover:bg-emerald-600 hover:text-white'
                      }`}
                    >
                      {isCurrent ? 'Continue as ' + cfg.user?.name : 'Switch to ' + cfg.user?.name}
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
