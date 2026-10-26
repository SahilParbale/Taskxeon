import React from 'react';
import { TaskStatus } from '../../types';
import { Circle, Clock, AlertOctagon, CheckCircle2 } from 'lucide-react';

export const StatusBadge: React.FC<{ status: TaskStatus; className?: string }> = ({ status, className = '' }) => {
  const config = {
    todo: {
      label: 'To Do',
      classes: 'bg-slate-100 text-slate-700 border-slate-200',
      icon: <Circle className="w-3 h-3 text-slate-400" />
    },
    in_progress: {
      label: 'In Progress',
      classes: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      icon: <Clock className="w-3 h-3 text-emerald-600 animate-spin-slow" />
    },
    blocked: {
      label: 'Blocked',
      classes: 'bg-rose-50 text-rose-700 border-rose-200',
      icon: <AlertOctagon className="w-3 h-3 text-rose-600" />
    },
    completed: {
      label: 'Completed',
      classes: 'bg-emerald-100/80 text-emerald-900 border-emerald-300 font-medium',
      icon: <CheckCircle2 className="w-3 h-3 text-emerald-700" />
    }
  }[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs border ${config.classes} ${className}`}
    >
      {config.icon}
      <span>{config.label}</span>
    </span>
  );
};
