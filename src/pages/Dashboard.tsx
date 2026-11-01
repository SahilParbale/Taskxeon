import React from 'react';
import { useApp } from '../context/AppContext';
import { StatusBadge } from '../components/common/StatusBadge';
import { PriorityBadge } from '../components/common/PriorityBadge';
import { PresenceBadge } from '../components/common/PresenceBadge';
import {
  Plus,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FolderKanban,
  Users,
  Activity,
  ArrowRight,
  TrendingUp,
  Sparkles,
  Calendar,
  Layers,
  Terminal,
  ShieldCheck,
  MessageSquare
} from 'lucide-react';
import { getTodayDateString, isPastDate, isUpcomingDate, formatTodayDisplay } from '../lib/dateUtils';

export const Dashboard: React.FC = () => {
  const {
    currentUser,
    tasks,
    projects,
    users,
    activities,
    assignedTasks,
    setIsCreateModalOpen,
    setIsCreateProjectModalOpen,
    setSelectedTaskId,
    setSelectedProjectId,
    setCurrentView,
    updateTaskStatus,
    setUserPresence,
    sendMessage
  } = useApp();

  const [managerTaskFilter, setManagerTaskFilter] = React.useState<'all' | 'previous' | 'upcoming'>('all');
  const [employeeTaskFilter, setEmployeeTaskFilter] = React.useState<'all' | 'previous' | 'active'>('all');

  // Metric computations
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length;
  const blockedTasks = tasks.filter(t => t.status === 'blocked').length;
  const overdueTasks = tasks.filter(
    t => t.status !== 'completed' && isPastDate(t.dueDate)
  ).length;

  const overallProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Team presence stats (employees only)
  const employeeUsers = users.filter(u => u.role === 'employee');
  const onlineCount = employeeUsers.filter(u => u.presence === 'online').length;
  const breakCount = employeeUsers.filter(u => u.presence === 'break').length;
  const offlineCount = employeeUsers.filter(u => u.presence === 'offline').length;

  // Formatted date (Live current day)
  const todayFormatted = formatTodayDisplay();
  const todayStr = getTodayDateString();

  // Render Manager Dashboard View
  const renderManagerView = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Overview
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-semibold text-xs border border-emerald-200">
              {currentUser.department && currentUser.department.toLowerCase().includes('market') ? 'Marketing Workspace' : 'Software Workspace'}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            Welcome back, {currentUser.name} • {todayFormatted}
          </p>
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setIsCreateProjectModalOpen(true)}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold text-xs shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 text-emerald-700" />
            <span>{currentUser.department && currentUser.department.toLowerCase().includes('market') ? 'New Campaign' : 'New Project'}</span>
          </button>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Assign New Task</span>
          </button>
        </div>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Tasks & Rate */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-soft">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Completion Rate</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 tabular-nums">
              {overallProgress}%
            </span>
            <span className="text-xs text-slate-500">
              ({completedTasks}/{totalTasks} tasks)
            </span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-emerald-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
        </div>

        {/* In Progress */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-soft">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">In Progress</span>
            <Clock className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 tabular-nums">
              {inProgressTasks}
            </span>
            <span className="text-xs text-emerald-700 font-medium">Active work</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Under active development</p>
        </div>

        {/* At Risk / Overdue */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-soft">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Blocked & Overdue</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-rose-600 tabular-nums">
              {blockedTasks + overdueTasks}
            </span>
            <span className="text-xs text-rose-700 font-medium">Needs Attention</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            {blockedTasks} blocked, {overdueTasks} overdue
          </p>
        </div>

        {/* Team Availability */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-soft">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Team Presence</span>
            <Users className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-sm font-bold text-slate-800">{onlineCount}</span>
              <span className="text-[11px] text-slate-400">Online</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="text-sm font-bold text-slate-800">{breakCount}</span>
              <span className="text-[11px] text-slate-400">Break</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-slate-300" />
              <span className="text-sm font-bold text-slate-800">{offlineCount}</span>
              <span className="text-[11px] text-slate-400">Away</span>
            </div>
          </div>
          <button
            onClick={() => setCurrentView('team')}
            className="text-[11px] text-emerald-700 hover:text-emerald-800 font-semibold mt-2 inline-flex items-center gap-1"
          >
            View directory <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Project Health Cards Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <FolderKanban className="w-4 h-4 text-emerald-700" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800">
              Active Project Health
            </h2>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsCreateProjectModalOpen(true)}
              className="text-xs font-semibold text-emerald-700 hover:bg-emerald-100/80 flex items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Project</span>
            </button>
            <button
              onClick={() => setCurrentView('projects')}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1"
            >
              All projects <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {projects.length === 0 ? (
          <div className="bg-white rounded-xl border border-dashed border-slate-300 p-8 text-center shadow-soft">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto mb-3">
              <FolderKanban className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">No active projects yet</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Create your organization's first project initiative to start grouping deliverables and milestones.
            </p>
            <button
              onClick={() => setIsCreateProjectModalOpen(true)}
              className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              Create First Project
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {projects.map(proj => {
              const healthBadge = {
                on_track: 'bg-emerald-50 text-emerald-800 border-emerald-200',
                at_risk: 'bg-amber-50 text-amber-800 border-amber-200',
                behind: 'bg-rose-50 text-rose-800 border-rose-200'
              }[proj.health];

              const healthText = {
                on_track: 'On Track',
                at_risk: 'At Risk',
                behind: 'Behind'
              }[proj.health];

              return (
                <div
                  key={proj.id}
                  onClick={() => {
                    setSelectedProjectId(proj.id);
                    setCurrentView('project_detail');
                  }}
                  className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-soft hover:shadow-soft-md hover:border-emerald-300 transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                      {proj.key}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${healthBadge}`}>
                      {healthText}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-sm mb-1 group-hover:text-emerald-800 transition-colors truncate">
                    {proj.name}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-2 mb-3 min-h-[32px]">
                    {proj.description}
                  </p>

                  {/* Progress bar */}
                  <div className="space-y-1 mb-3">
                    <div className="flex justify-between text-xs text-slate-600">
                      <span className="font-medium">Progress</span>
                      <span className="font-bold tabular-nums text-slate-900">{proj.progress}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                        style={{ width: `${proj.progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100">
                    <span>
                      Updated by {proj.lastUpdatedBy ? proj.lastUpdatedBy.split(' ')[0] : 'Team'}
                    </span>
                    <span>Due {proj.deadline}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Two Columns: Recent Sprint Tasks & Live Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Sprint Tasks Table with Date Scope */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200/80 shadow-soft overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <h3 className="font-bold text-slate-900 text-sm">Sprint Task Status</h3>
            </div>

            {/* Quick Date Scope Filter for Sprint Tasks */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs font-semibold">
              <button
                onClick={() => setManagerTaskFilter('all')}
                className={`px-2 py-0.5 rounded-md transition-all ${
                  managerTaskFilter === 'all'
                    ? 'bg-white text-slate-900 shadow-sm font-bold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                All Dates ({tasks.length})
              </button>
              <button
                onClick={() => setManagerTaskFilter('previous')}
                className={`px-2 py-0.5 rounded-md transition-all flex items-center gap-1 ${
                  managerTaskFilter === 'previous'
                    ? 'bg-white text-amber-900 shadow-sm font-bold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Clock className="w-3 h-3 text-amber-600" />
                <span>Previous Dates ({tasks.filter(t => isPastDate(t.dueDate)).length})</span>
              </button>
              <button
                onClick={() => setManagerTaskFilter('upcoming')}
                className={`px-2 py-0.5 rounded-md transition-all ${
                  managerTaskFilter === 'upcoming'
                    ? 'bg-white text-emerald-800 shadow-sm font-bold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Upcoming ({tasks.filter(t => isUpcomingDate(t.dueDate) || t.dueDate === todayStr).length})
              </button>
            </div>

            <button
              onClick={() => setCurrentView('tasks')}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
            >
              View Full Board <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="divide-y divide-slate-100 max-h-[460px] overflow-y-auto">
            {tasks.length === 0 ? (
              <div className="p-8 text-center">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-60" />
                <p className="text-sm font-bold text-slate-800">No sprint tasks created yet</p>
                <p className="text-xs text-slate-500 mt-1">Assign deliverables to team members to track progress here.</p>
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="mt-3.5 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Assign New Task
                </button>
              </div>
            ) : tasks
              .filter(t => {
                if (managerTaskFilter === 'previous') return isPastDate(t.dueDate);
                if (managerTaskFilter === 'upcoming') return isUpcomingDate(t.dueDate) || t.dueDate === todayStr;
                return true;
              }).length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  No tasks match the selected filter.
                </div>
              ) : (
                tasks
                  .filter(t => {
                    if (managerTaskFilter === 'previous') return isPastDate(t.dueDate);
                    if (managerTaskFilter === 'upcoming') return isUpcomingDate(t.dueDate) || t.dueDate === todayStr;
                    return true;
                  })
                  .map(t => {
                    const assignee = users.find(u => u.id === t.assigneeId);
                    const isPast = isPastDate(t.dueDate);
                    return (
                      <div
                        key={t.id}
                        onClick={() => setSelectedTaskId(t.id)}
                        className="p-3.5 hover:bg-slate-50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 sm:gap-3 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0 w-full sm:w-auto">
                          {/* Status checkbox / button */}
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              updateTaskStatus(
                                t.id,
                                t.status === 'completed' ? 'in_progress' : 'completed'
                              );
                            }}
                            className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all flex-shrink-0 cursor-pointer ${
                              t.status === 'completed'
                                ? 'bg-emerald-600 border-emerald-600 text-white'
                                : 'border-slate-300 hover:border-emerald-500 text-transparent'
                            }`}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </button>

                          <div className="min-w-0 flex-1">
                            <p
                              className={`text-xs font-semibold truncate ${
                                t.status === 'completed' ? 'text-slate-400 line-through' : 'text-slate-800'
                              }`}
                            >
                              {t.title}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400 flex-wrap">
                              <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-100">
                                TASK-{t.id.replace('task-', '')}
                              </span>
                              <span>•</span>
                              {t.createdAt && (
                                <>
                                  <span>Assigned {new Date(t.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                                  <span>•</span>
                                </>
                              )}
                              <span className={isPast && t.status !== 'completed' ? 'text-rose-600 font-semibold' : ''}>
                                Due {t.dueDate}
                                {isPast && ' (Previous)'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap sm:flex-nowrap w-full sm:w-auto justify-between sm:justify-end pl-8 sm:pl-0">
                          <PriorityBadge priority={t.priority} showIcon={false} />
                          <StatusBadge status={t.status} />

                          {/* Discuss in Group Chat button for employee on their tasks */}
                          {currentUser.role === 'employee' && (
                            <button
                              onClick={e => {
                                e.stopPropagation();
                                sendMessage(
                                  `Let's discuss task "${t.title}" (Due: ${t.dueDate} | Priority: ${t.priority.toUpperCase()})`,
                                  'ch-team-chat'
                                );
                                setCurrentView('messages');
                              }}
                              className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                              title="Discuss in Group Chat"
                            >
                              <MessageSquare className="w-3.5 h-3.5 text-emerald-700" />
                              <span className="hidden sm:inline">Discuss</span>
                            </button>
                          )}

                          {/* Assignee Avatar with presence */}
                          {assignee && (
                            <div className="relative flex-shrink-0" title={assignee.role !== 'manager' ? `${assignee.name} (${assignee.presence})` : assignee.name}>
                              <img
                                src={assignee.avatar}
                                alt={assignee.name}
                                className="w-6 h-6 rounded-full object-cover ring-1 ring-slate-200"
                              />
                              {assignee.role !== 'manager' && (
                                <span className="absolute -bottom-0.5 -right-0.5">
                                  <PresenceBadge status={assignee.presence} variant="dot" size="sm" />
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
              )}
          </div>
        </div>

        {/* Right: Activity Feed */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-soft p-4">
          <div className="flex items-center gap-2 mb-3 pb-3 border-b border-slate-100">
            <Activity className="w-4 h-4 text-emerald-600" />
            <h3 className="font-bold text-slate-900 text-sm">Real-time Activity Feed</h3>
          </div>

          <div className="space-y-3.5">
            {activities.length === 0 ? (
              <div className="py-8 text-center text-slate-400">
                <Activity className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
                <p className="text-xs font-semibold text-slate-600">No activity recorded yet</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Actions, status updates, and new deliverables will stream here live.</p>
              </div>
            ) : (
              activities.slice(0, 6).map(act => {
                const actor = users.find(u => u.id === act.userId);
                return (
                  <div key={act.id} className="flex items-start gap-2.5 text-xs">
                    {actor && (
                      <img
                        src={actor.avatar}
                        alt={actor.name}
                        className="w-6 h-6 rounded-full object-cover flex-shrink-0 mt-0.5"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-slate-700 leading-snug">
                        <strong className="text-slate-900 font-semibold">{actor?.name}</strong>{' '}
                        {act.action}{' '}
                        <span className="font-medium text-emerald-800">"{act.target}"</span>
                      </p>
                      <span className="text-[10px] text-slate-400 mt-0.5 block">{act.timestamp}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // Render Employee Dashboard View
  const renderEmployeeView = () => {
    const activeAssigned = assignedTasks.filter(t => t.status !== 'completed');

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Employee Workspace
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Good day, {currentUser.name} • {todayFormatted}
            </p>
          </div>

          {/* Quick Presence Selector */}
          <div className="bg-white p-1.5 rounded-xl border border-slate-200 shadow-soft flex flex-wrap sm:flex-nowrap items-center gap-1.5 text-xs">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 pl-1.5">
              Your Presence:
            </span>
            <div className="flex items-center gap-1">
              {(['online', 'break', 'offline'] as const).map(st => (
                <button
                  key={st}
                  onClick={() => setUserPresence(st)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize transition-all ${
                    currentUser.presence === st
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {st === 'break' ? 'On Break' : st}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Assigned Deliverable Alert Banner */}
        {activeAssigned.length > 0 && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-emerald-700" />
              <div>
                <p className="text-xs font-bold text-emerald-950">
                  You have {activeAssigned.length} active assigned deliverable{activeAssigned.length === 1 ? '' : 's'}!
                </p>
                <p className="text-xs text-emerald-800">
                  Priority: "{activeAssigned[0].title}"
                </p>
              </div>
            </div>
            <button
              onClick={() => setSelectedTaskId(activeAssigned[0].id)}
              className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold shadow-sm transition-all flex items-center gap-1"
            >
              Open Task <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Assigned Tasks Summary & List */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-soft overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Your Deliverables</h2>
              <p className="text-xs text-slate-500">
                {assignedTasks.filter(t => t.status === 'completed').length} of {assignedTasks.length} tasks completed
              </p>
            </div>

            {/* Scope Filter Pills for Employee */}
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg text-xs font-semibold">
              <button
                onClick={() => setEmployeeTaskFilter('all')}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  employeeTaskFilter === 'all'
                    ? 'bg-white text-slate-900 shadow-sm font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All Dates ({assignedTasks.length})
              </button>
              <button
                onClick={() => setEmployeeTaskFilter('previous')}
                className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1 ${
                  employeeTaskFilter === 'previous'
                    ? 'bg-white text-amber-900 shadow-sm font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Clock className="w-3 h-3 text-amber-600" />
                Previous Assigned ({assignedTasks.filter(t => isPastDate(t.dueDate)).length})
              </button>
              <button
                onClick={() => setEmployeeTaskFilter('active')}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  employeeTaskFilter === 'active'
                    ? 'bg-white text-emerald-900 shadow-sm font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Active ({activeAssigned.length})
              </button>
            </div>

            <button
              onClick={() => setCurrentView('tasks')}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
            >
              Open Full Task Board <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="divide-y divide-slate-100 max-h-[460px] overflow-y-auto">
            {assignedTasks.length === 0 ? (
              <div className="p-8 text-center">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-800">No active tasks assigned</p>
                <p className="text-xs text-slate-500">You are completely caught up!</p>
              </div>
            ) : (
              assignedTasks
                .filter(task => {
                  if (employeeTaskFilter === 'previous') return isPastDate(task.dueDate);
                  if (employeeTaskFilter === 'active') return task.status !== 'completed';
                  return true;
                })
                .map(task => {
                  const isDone = task.status === 'completed';
                  const isPast = isPastDate(task.dueDate);
                  return (
                    <div
                      key={task.id}
                      onClick={() => setSelectedTaskId(task.id)}
                      className={`p-3.5 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 sm:gap-4 cursor-pointer transition-colors ${
                        isDone ? 'bg-slate-50/50' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 w-full sm:w-auto">
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            updateTaskStatus(
                              task.id,
                              isDone ? 'in_progress' : 'completed'
                            );
                          }}
                          className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all flex-shrink-0 cursor-pointer ${
                            isDone
                              ? 'bg-emerald-600 border-emerald-600 text-white'
                              : 'border-slate-300 hover:border-emerald-500 text-transparent'
                          }`}
                          title={isDone ? 'Mark as In Progress' : 'Click to complete task!'}
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>

                        <div className="min-w-0 flex-1">
                          <p
                            className={`text-sm font-semibold truncate ${
                              isDone ? 'text-slate-400 line-through' : 'text-slate-900'
                            }`}
                          >
                            {task.title}
                          </p>
                          <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 flex-wrap">
                            <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-100">
                              TASK-{task.id.replace('task-', '')}
                            </span>
                            <span>•</span>
                            {task.createdAt && (
                              <>
                                <span>Assigned {new Date(task.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                                <span>•</span>
                              </>
                            )}
                            <span className={isPast && !isDone ? 'text-rose-600 font-bold' : ''}>
                              Due {task.dueDate}
                              {isPast && ' (Previous Date)'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap w-full sm:w-auto justify-between sm:justify-end pl-9 sm:pl-0">
                        <PriorityBadge priority={task.priority} />
                        <StatusBadge status={task.status} />
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        </div>

        {/* Manual Project Progress Section for Employee */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-soft p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <FolderKanban className="w-4 h-4 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-sm">Team Projects & Manual Progress</h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Employees and managers can manually update progress for each project.
              </p>
            </div>
            <button
              onClick={() => setCurrentView('projects')}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
            >
              Open Project Station <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {projects.length === 0 ? (
            <div className="p-6 text-center text-slate-400 text-xs">
              <FolderKanban className="w-8 h-8 text-slate-300 mx-auto mb-1.5" />
              <p className="font-semibold text-slate-600">No active projects assigned</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Projects created by managers will appear here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {projects.map(proj => (
                <div
                  key={proj.id}
                  onClick={() => {
                    setSelectedProjectId(proj.id);
                    setCurrentView('projects');
                  }}
                  className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-emerald-300 transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-100">
                      {proj.key}
                    </span>
                    <span className="text-xs font-extrabold text-emerald-800">{proj.progress}%</span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 group-hover:text-emerald-800 transition-colors truncate">
                    {proj.name}
                  </h4>
                  <div className="w-full bg-slate-200/70 h-1.5 rounded-full overflow-hidden mt-2">
                    <div
                      className="bg-emerald-600 h-full rounded-full transition-all duration-300"
                      style={{ width: `${proj.progress}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1.5 truncate">
                    Updated by {proj.lastUpdatedBy ? proj.lastUpdatedBy.split(' ')[0] : 'Team'}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="py-6 px-4 sm:px-8 max-w-7xl mx-auto">
      {currentUser.role === 'manager' ? renderManagerView() : renderEmployeeView()}
    </div>
  );
};
