import React from 'react';
import { Role } from '../../types';
import { ShieldCheck, UserCheck } from 'lucide-react';

export const RoleBadge: React.FC<{ role: Role; className?: string }> = ({ role, className = '' }) => {
  switch (role) {
    case 'manager':
      return (
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 ${className}`}
        >
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
          Manager
        </span>
      );
    case 'employee':
    default:
      return (
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200 ${className}`}
        >
          <UserCheck className="w-3.5 h-3.5 text-slate-600" />
          Employee
        </span>
      );
  }
};
