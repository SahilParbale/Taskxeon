import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { PresenceStatus } from '../types';
import { PresenceBadge } from '../components/common/PresenceBadge';
import { RoleBadge } from '../components/common/RoleBadge';
import { CustomSelect } from '../components/common/CustomSelect';
import {
  Users,
  Mail,
  Phone,
  MessageSquare,
  Sparkles,
  Search,
  UserPlus,
  Plus,
  Trash2,
  CheckSquare,
  Briefcase,
  Building,
  CheckCircle2,
  Clock,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

export const TeamPage: React.FC = () => {
  const {
    users,
    currentUser,
    tasks,
    setUserPresence,
    setCurrentView,
    openChatWithUser,
    setIsCreateEmployeeModalOpen,
    setIsCreateModalOpen,
    deleteEmployee
  } = useApp();

  const [filterPresence, setFilterPresence] = useState<string>('all');
  const [filterDepartment, setFilterDepartment] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const isManager = currentUser.role === 'manager';

  // Exclude manager from the team roster list (as requested in prior step)
  const employeeUsers = users.filter(u => u.role === 'employee');
  const onlineCount = employeeUsers.filter(u => u.presence === 'online').length;
  const breakCount = employeeUsers.filter(u => u.presence === 'break').length;
  const offlineCount = employeeUsers.filter(u => u.presence === 'offline').length;

  // Extract distinct departments for filter dropdown
  const departments = Array.from(new Set(employeeUsers.map(u => u.department))).filter(Boolean);

  const filteredUsers = employeeUsers.filter(user => {
    if (filterPresence !== 'all' && user.presence !== filterPresence) return false;
    if (filterDepartment !== 'all' && user.department !== filterDepartment) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        user.name.toLowerCase().includes(q) ||
        user.title.toLowerCase().includes(q) ||
        user.department.toLowerCase().includes(q) ||
        user.email.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="py-6 px-4 sm:px-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {isManager ? 'My Team' : 'Team & Presence Directory'}
            </h1>
            {isManager ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                Manager View
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                Employee View
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {isManager
              ? 'Manage employee roster, monitor real-time availability, and onboard new team members.'
              : 'Real-time teammate availability, role classifications, and workload distribution.'}
          </p>
        </div>

        {/* Header Action: Add Employee for Manager, Availability Toggle for Employee */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          {isManager ? (
            <button
              onClick={() => setIsCreateEmployeeModalOpen(true)}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-soft hover:shadow-soft-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add New Employee</span>
            </button>
          ) : (
            <div className="bg-white p-1.5 sm:p-2 rounded-2xl border border-slate-200 shadow-soft flex flex-wrap sm:flex-nowrap items-center gap-1.5 sm:gap-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider pl-1 sm:pl-2">
                My Status:
              </span>
              <div className="flex items-center gap-1">
                {(['online', 'break', 'offline'] as PresenceStatus[]).map(st => (
                  <button
                    key={st}
                    onClick={() => setUserPresence(st)}
                    className={`px-3 py-1 rounded-xl text-xs font-semibold capitalize transition-all ${
                      currentUser.presence === st
                        ? 'bg-emerald-600 text-white shadow-sm font-bold'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {st === 'break' ? 'On Break' : st}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Availability Metrics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div
          onClick={() => setFilterPresence('all')}
          className={`bg-white p-4 rounded-2xl border transition-all cursor-pointer shadow-soft hover:border-slate-300 ${
            filterPresence === 'all' ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              {isManager ? 'Team Employees' : 'Team Members'}
            </span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-1">{employeeUsers.length}</p>
          <span className="text-[11px] text-slate-500">Total active headcount</span>
        </div>

        <div
          onClick={() => setFilterPresence('online')}
          className={`bg-white p-4 rounded-2xl border transition-all cursor-pointer shadow-soft hover:border-slate-300 ${
            filterPresence === 'online' ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider block">
              Online Now
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{onlineCount}</p>
          <span className="text-[11px] text-emerald-600 font-medium">Ready for immediate sync</span>
        </div>

        <div
          onClick={() => setFilterPresence('break')}
          className={`bg-white p-4 rounded-2xl border transition-all cursor-pointer shadow-soft hover:border-slate-300 ${
            filterPresence === 'break' ? 'border-amber-500 ring-2 ring-amber-500/20' : 'border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-700 uppercase tracking-wider block">
              On Break
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
          </div>
          <p className="text-2xl font-bold text-amber-600 mt-1">{breakCount}</p>
          <span className="text-[11px] text-amber-600 font-medium">Temporarily away</span>
        </div>

        <div
          onClick={() => setFilterPresence('offline')}
          className={`bg-white p-4 rounded-2xl border transition-all cursor-pointer shadow-soft hover:border-slate-300 ${
            filterPresence === 'offline' ? 'border-slate-500 ring-2 ring-slate-500/20' : 'border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Offline
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
          </div>
          <p className="text-2xl font-bold text-slate-600 mt-1">{offlineCount}</p>
          <span className="text-[11px] text-slate-400">Outside working hours</span>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search employee by name, title, department, email..."
            className="w-full pl-9 pr-4 py-2.5 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 shadow-soft"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Department Filter */}
          <CustomSelect
            value={filterDepartment}
            onChange={val => setFilterDepartment(val)}
            options={[
              { value: 'all', label: `All Departments (${employeeUsers.length})` },
              ...departments.map(dept => ({
                value: dept,
                label: dept
              }))
            ]}
          />

          {/* Quick Clear */}
          {(filterPresence !== 'all' || filterDepartment !== 'all' || search.trim()) && (
            <button
              onClick={() => {
                setFilterPresence('all');
                setFilterDepartment('all');
                setSearch('');
              }}
              className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold transition-colors"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Team Cards Grid */}
      {filteredUsers.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 border border-slate-200 text-center shadow-soft">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center">
            <Users className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No employees found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {search.trim() || filterPresence !== 'all' || filterDepartment !== 'all'
              ? 'No team members match your current filter settings. Try adjusting your query or resetting filters.'
              : 'There are no employees registered on your team yet.'}
          </p>
          <div className="mt-4 flex items-center justify-center gap-3">
            {(search.trim() || filterPresence !== 'all' || filterDepartment !== 'all') && (
              <button
                onClick={() => {
                  setFilterPresence('all');
                  setFilterDepartment('all');
                  setSearch('');
                }}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
              >
                Clear Search Filters
              </button>
            )}
            {isManager && (
              <button
                onClick={() => setIsCreateEmployeeModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Add Employee</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUsers.map(member => {
            const memberTasks = tasks.filter(t => t.assigneeId === member.id);
            const activeTasks = memberTasks.filter(t => t.status !== 'completed');
            const completedCount = memberTasks.filter(t => t.status === 'completed').length;
            const isCurrent = member.id === currentUser.id;
            const isDeleting = confirmDeleteId === member.id;

            return (
              <div
                key={member.id}
                className={`bg-white rounded-2xl p-6 border shadow-soft hover:shadow-soft-md transition-all flex flex-col justify-between relative group ${
                  isCurrent ? 'border-emerald-500/80 ring-1 ring-emerald-500/20' : 'border-slate-200'
                }`}
              >
                <div>
                  {/* Top Bar: Avatar, Presence, Role, and Manager Delete Action */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="relative">
                      <img
                        src={member.avatar}
                        alt={member.name}
                        className="w-14 h-14 rounded-2xl object-cover ring-2 ring-slate-100 shadow-soft-sm"
                      />
                      <span className="absolute -bottom-1 -right-1">
                        <PresenceBadge status={member.presence} variant="dot" size="md" />
                      </span>
                    </div>

                    <div className="flex flex-col items-end gap-1.5">
                      <div className="flex items-center gap-1.5">
                        <RoleBadge role={member.role} />
                        {isManager && (
                          <button
                            onClick={() => setConfirmDeleteId(isDeleting ? null : member.id)}
                            className="p-1 rounded-lg text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Remove employee from team"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      <PresenceBadge status={member.presence} variant="pill" size="sm" />
                    </div>
                  </div>

                  {/* Inline Delete Confirmation for Manager */}
                  {isDeleting && (
                    <div className="mb-3 p-3 bg-rose-50 border border-rose-200 rounded-xl">
                      <div className="flex items-center gap-2 text-rose-800 text-xs font-bold mb-1.5">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>Remove {member.name}?</span>
                      </div>
                      <p className="text-[11px] text-rose-600 mb-2">
                        This employee will be removed from the team roster.
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            deleteEmployee(member.id);
                            setConfirmDeleteId(null);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-rose-600 text-white text-[10px] font-bold hover:bg-rose-700"
                        >
                          Confirm Remove
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-600 text-[10px] font-medium hover:bg-slate-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Member Name & Title */}
                  <div className="mb-3">
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-bold text-slate-900 text-base">{member.name}</h3>
                      {isCurrent && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                          You
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 font-medium">{member.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                        <Building className="w-3 h-3 text-emerald-600" />
                        {member.department}
                      </span>
                    </div>
                  </div>

                  {/* Contact Info (Email & Phone) */}
                  <div className="space-y-1 mb-3 text-xs text-slate-600">
                    <a
                      href={`mailto:${member.email}`}
                      className="flex items-center gap-1.5 text-slate-600 hover:text-emerald-700 transition-colors group/mail"
                    >
                      <Mail className="w-3.5 h-3.5 text-slate-400 group-hover/mail:text-emerald-600" />
                      <span className="truncate">{member.email}</span>
                    </a>
                    {member.phone && (
                      <div className="flex items-center gap-1.5 text-slate-500">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>{member.phone}</span>
                      </div>
                    )}
                  </div>

                  {/* Bio snippet */}
                  {member.bio && (
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-4 bg-slate-50/70 p-2.5 rounded-xl border border-slate-100">
                      {member.bio}
                    </p>
                  )}
                </div>

                <div>
                  {/* Workload stats */}
                  <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100 mb-3 text-xs">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">
                        Active Tasks
                      </span>
                      <span className="text-base font-bold text-slate-800 tabular-nums">
                        {activeTasks.length}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">
                        Completed
                      </span>
                      <span className="text-base font-bold text-emerald-700 tabular-nums">
                        {completedCount}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openChatWithUser(member.id)}
                      className="flex-1 py-2 px-3 rounded-xl bg-slate-100 hover:bg-emerald-600 hover:text-white text-slate-700 text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Message</span>
                    </button>

                    {isManager && (
                      <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="py-2 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-semibold transition-all flex items-center justify-center gap-1"
                        title={`Assign task to ${member.name}`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Assign Task</span>
                      </button>
                    )}

                    <a
                      href={`mailto:${member.email}`}
                      className="p-2 rounded-xl border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors"
                      title={`Email ${member.name}`}
                    >
                      <Mail className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
