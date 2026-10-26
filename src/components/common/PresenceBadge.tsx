import React from 'react';
import { PresenceStatus } from '../../types';

interface PresenceBadgeProps {
  status: PresenceStatus;
  variant?: 'pill' | 'dot';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export const PresenceBadge: React.FC<PresenceBadgeProps> = ({
  status,
  variant = 'pill',
  size = 'md',
  showLabel = true,
  className = ''
}) => {
  const config = {
    online: {
      label: 'Online',
      color: 'bg-emerald-500',
      pillBg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      ping: true
    },
    break: {
      label: 'On Break',
      color: 'bg-amber-500',
      pillBg: 'bg-amber-50 text-amber-800 border-amber-200',
      ping: false
    },
    offline: {
      label: 'Offline',
      color: 'bg-slate-400',
      pillBg: 'bg-slate-100 text-slate-700 border-slate-200',
      ping: false
    }
  }[status];

  const dotSizes = {
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3'
  }[size];

  if (variant === 'dot') {
    return (
      <span className={`relative flex items-center justify-center ${dotSizes} ${className}`} title={config.label}>
        {config.ping && (
          <span className={`absolute inline-flex h-full w-full rounded-full ${config.color} opacity-75 animate-ping`} />
        )}
        <span className={`relative inline-flex rounded-full ${dotSizes} ${config.color}`} />
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.pillBg} ${className}`}
    >
      <span className="relative flex h-2 w-2">
        {config.ping && (
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${config.color} opacity-75`} />
        )}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${config.color}`} />
      </span>
      {showLabel && <span>{config.label}</span>}
    </span>
  );
};
