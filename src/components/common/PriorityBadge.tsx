import React from 'react';
import { TaskPriority } from '../../types';
import { AlertCircle, Flame, ArrowUp, ArrowDown } from 'lucide-react';

export const PriorityBadge: React.FC<{ priority: TaskPriority; showIcon?: boolean; className?: string }> = ({
  priority,
  showIcon = true,
  className = ''
}) => {
  const config = {
    urgent: {
      label: 'Urgent',
      bg: 'bg-rose-50 text-rose-700 border-rose-200',
      icon: <Flame className="w-3 h-3 text-rose-600" />
    },
    high: {
      label: 'High',
      bg: 'bg-amber-50 text-amber-800 border-amber-200',
      icon: <AlertCircle className="w-3 h-3 text-amber-600" />
    },
    medium: {
      label: 'Medium',
      bg: 'bg-blue-50 text-blue-700 border-blue-200',
      icon: <ArrowUp className="w-3 h-3 text-blue-600" />
    },
    low: {
      label: 'Low',
      bg: 'bg-slate-50 text-slate-600 border-slate-200',
      icon: <ArrowDown className="w-3 h-3 text-slate-400" />
    }
  }[priority];

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border ${config.bg} ${className}`}
    >
      {showIcon && config.icon}
      <span>{config.label}</span>
    </span>
  );
};
