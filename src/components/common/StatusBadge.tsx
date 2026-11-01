import React from 'react';
import { TaskStatus } from '../../types';
import { Circle, Clock, AlertOctagon, CheckCircle2, Phone, MapPin, Presentation } from 'lucide-react';

export const StatusBadge: React.FC<{ status: TaskStatus; className?: string; size?: 'sm' | 'md' }> = ({
  status,
  className = '',
  size = 'md'
}) => {
  const configs: Record<TaskStatus, { label: string; classes: string; icon: React.ReactNode }> = {
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
      label: 'Completed / Won',
      classes: 'bg-emerald-100/80 text-emerald-900 border-emerald-300 font-medium',
      icon: <CheckCircle2 className="w-3 h-3 text-emerald-700" />
    },
    calling: {
      label: 'Calling & Outreach',
      classes: 'bg-sky-50 text-sky-800 border-sky-200 font-medium',
      icon: <Phone className="w-3 h-3 text-sky-600" />
    },
    field_visit: {
      label: 'Field Visit',
      classes: 'bg-amber-50 text-amber-800 border-amber-200 font-medium',
      icon: <MapPin className="w-3 h-3 text-amber-600" />
    },
    demo: {
      label: 'Product Demo',
      classes: 'bg-purple-50 text-purple-800 border-purple-200 font-medium',
      icon: <Presentation className="w-3 h-3 text-purple-600" />
    }
  };

  const config = configs[status] || {
    label: status,
    classes: 'bg-slate-100 text-slate-700 border-slate-200',
    icon: <Circle className="w-3 h-3 text-slate-400" />
  };

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-0.5 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${sizeClasses} ${config.classes} ${className}`}
    >
      {config.icon}
      <span>{config.label}</span>
    </span>
  );
};
