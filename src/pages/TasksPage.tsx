import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { TaskStatus, TaskPriority } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { PriorityBadge } from '../components/common/PriorityBadge';
import { PresenceBadge } from '../components/common/PresenceBadge';
import {
  LayoutList,
  Kanban,
  Plus,
  Search,
  CheckCircle2,
  Calendar,
  Clock,
  ArrowUpDown,
  Folder,
  ChevronLeft,
  ChevronRight,
  MessageSquare
} from 'lucide-react';
import { getTodayDateString, isToday, isPastDate, formatCustomDateLabel } from '../lib/dateUtils';
import { CustomSelect } from '../components/common/CustomSelect';
import { CustomDatePicker } from '../components/common/CustomDatePicker';

export const TasksPage: React.FC = () => {
  const {
    tasks,
    projects,
    users,
    currentUser,
    setIsCreateModalOpen,
    setSelectedTaskId,
    updateTaskStatus,
    setCurrentView,
    sendMessage
  } = useApp();

  const handleDiscussInGroupChat = (task: any) => {
    sendMessage(
      `💬 Let's discuss task "${task.title}" (Due: ${task.dueDate} | Priority: ${task.priority.toUpperCase()})`,
      'ch-team-chat'
    );
    setCurrentView('messages');
  };

  const [viewMode, setViewMode] = useState<'board' | 'table'>('board');
  const [search, setSearch] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [selectedAssignee, setSelectedAssignee] = useState(
    currentUser.role === 'employee' ? currentUser.id : 'all'
  );
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedProjectFilter, setSelectedProjectFilter] = useState('all');
  const [selectedDateScope, setSelectedDateScope] = useState<'all' | 'custom' | 'previous' | 'today' | 'upcoming'>('all');
  const [customDate, setCustomDate] = useState<string>(() => getTodayDateString());
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'priority'>('date_desc');

  useEffect(() => {
    setSelectedAssignee(currentUser.role === 'employee' ? currentUser.id : 'all');
  }, [currentUser.id, currentUser.role]);

  const todayStr = getTodayDateString();

  // Helper to step date backward/forward by days
  const handleStepDay = (deltaDays: number) => {
    try {
      const parts = customDate.split('-').map(Number);
      const d = new Date(parts[0], parts[1] - 1, parts[2]);
      d.setDate(d.getDate() + deltaDays);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const newStr = `${year}-${month}-${day}`;
      setCustomDate(newStr);
      setSelectedDateScope('custom');
    } catch {
      // fallback
    }
  };


  // Role-based task pool:
  // - Employees strictly see only tasks assigned to them (t.assigneeId === currentUser.id)
  // - Managers see all tasks across all assignees
  const roleScopedTasks = currentUser.role === 'employee'
    ? tasks.filter(t => t.assigneeId === currentUser.id)
    : tasks;

  // Filter tasks across all dates or selected date scope
  const filteredTasks = roleScopedTasks.filter(t => {
    if (search.trim()) {
      const q = search.toLowerCase();
      const match = t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q);
      if (!match) return false;
    }
    if (selectedPriority !== 'all' && t.priority !== selectedPriority) return false;

    // Only managers can filter by another specific assignee
    if (currentUser.role === 'manager' && selectedAssignee !== 'all' && t.assigneeId !== selectedAssignee) {
      return false;
    }

    if (selectedStatus !== 'all' && t.status !== selectedStatus) return false;
    if (selectedProjectFilter !== 'all' && t.projectId !== selectedProjectFilter) return false;

    // Date scope filter:
    // - "custom": shows tasks of the selected calendar day
    // - "all": shows all tasks across past, present, and future
    // - "previous": shows tasks before today
    // - "today": shows tasks for today
    // - "upcoming": shows upcoming tasks
    if (selectedDateScope === 'custom') {
      if (t.dueDate !== customDate) return false;
    } else if (selectedDateScope === 'previous') {
      if (t.dueDate >= todayStr) return false;
    } else if (selectedDateScope === 'today') {
      if (t.dueDate !== todayStr) return false;
    } else if (selectedDateScope === 'upcoming') {
      if (t.dueDate <= todayStr) return false;
    }

    return true;
  });

  // Sort tasks
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (sortBy === 'date_desc') {
      return new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime();
    }
    if (sortBy === 'date_asc') {
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    }
    if (sortBy === 'priority') {
      const pMap: Record<string, number> = { urgent: 4, high: 3, medium: 2, low: 1 };
      return (pMap[b.priority] || 0) - (pMap[a.priority] || 0);
    }
    return 0;
  });

  // Date scope metric counters strictly scoped to the user's role visibility
  const totalScopeCount = roleScopedTasks.length;
  const customDateTasksCount = roleScopedTasks.filter(t => t.dueDate === customDate).length;
  const previousTasksCount = roleScopedTasks.filter(t => t.dueDate < todayStr).length;
  const todayTasksCount = roleScopedTasks.filter(t => t.dueDate === todayStr).length;
  const upcomingTasksCount = roleScopedTasks.filter(t => t.dueDate > todayStr).length;

  const kanbanColumns: { id: TaskStatus; label: string; dotColor: string }[] = [
    { id: 'todo', label: 'To Do', dotColor: 'bg-slate-400' },
    { id: 'in_progress', label: 'In Progress', dotColor: 'bg-emerald-500' },
    { id: 'blocked', label: 'Blocked', dotColor: 'bg-rose-500' },
    { id: 'completed', label: 'Completed', dotColor: 'bg-emerald-700' }
  ];

  return (
    <div className="py-6 px-4 sm:px-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {currentUser.role === 'employee' ? 'My Assigned Tasks' : 'All Sprint Tasks'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {currentUser.role === 'employee'
              ? 'View and manage tasks specifically assigned to your persona.'
              : 'Assign deliverables to employees and monitor team execution across the sprint.'}
          </p>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          {/* View Toggle */}
          <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200">
            <button
              onClick={() => setViewMode('board')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'board'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Kanban className="w-3.5 h-3.5 text-emerald-600" />
              Board
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'table'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutList className="w-3.5 h-3.5 text-emerald-600" />
              List
            </button>
          </div>

          {currentUser.role === 'manager' && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all flex-shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Assign Task</span>
            </button>
          )}
        </div>
      </div>

      {/* Quick Date Scope & Assignee Timeline Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Date Scope Pills with Custom Calendar Date Selection */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl text-xs font-semibold">
          {/* Custom Date Calendar Control */}
          <div className="flex items-center gap-1.5">
            <CustomDatePicker
              value={customDate}
              onChange={val => {
                setCustomDate(val);
                setSelectedDateScope('custom');
              }}
              placeholder="Pick Date"
              buttonClassName={
                selectedDateScope === 'custom'
                  ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-white text-emerald-950 font-bold'
                  : 'bg-white/90'
              }
            />
            {selectedDateScope === 'custom' && (
              <span className="px-2 py-1 rounded-xl bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                {customDateTasksCount} task{customDateTasksCount === 1 ? '' : 's'}
              </span>
            )}
          </div>

          {/* Stepper buttons (prev day / next day) */}
          <div className="inline-flex items-center rounded-lg bg-white border border-slate-200 p-0.5">
            <button
              onClick={() => handleStepDay(-1)}
              className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded transition-colors"
              title="Previous Day"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleStepDay(1)}
              className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded transition-colors"
              title="Next Day"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Due Today Quick Pill */}
          <button
            onClick={() => {
              setCustomDate(todayStr);
              setSelectedDateScope('today');
            }}
            className={`px-2.5 py-1.5 rounded-lg transition-all ${
              selectedDateScope === 'today'
                ? 'bg-white text-emerald-900 shadow-sm font-bold ring-1 ring-emerald-600/20'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Today ({todayTasksCount})
          </button>

          {/* Previous Dates */}
          <button
            onClick={() => setSelectedDateScope('previous')}
            className={`px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
              selectedDateScope === 'previous'
                ? 'bg-white text-emerald-900 shadow-sm font-bold ring-1 ring-emerald-600/20'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>Previous Dates ({previousTasksCount})</span>
          </button>

          {/* Upcoming Dates */}
          <button
            onClick={() => setSelectedDateScope('upcoming')}
            className={`px-2.5 py-1.5 rounded-lg transition-all ${
              selectedDateScope === 'upcoming'
                ? 'bg-white text-slate-900 shadow-sm font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Upcoming ({upcomingTasksCount})
          </button>

          {/* Show All Dates */}
          <button
            onClick={() => setSelectedDateScope('all')}
            className={`px-2.5 py-1.5 rounded-lg transition-all ${
              selectedDateScope === 'all'
                ? 'bg-white text-slate-900 shadow-sm font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
            title="View all dates"
          >
            All Dates ({totalScopeCount})
          </button>
        </div>

        {/* Manager role indicator / Employee My Tasks counter */}
        {currentUser.role === 'manager' ? (
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 hidden sm:inline">
              Team Deliverables:
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 font-bold text-xs border border-emerald-200">
              {tasks.length} Total Deliverables
            </span>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Assign Task</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 bg-emerald-50/80 px-3 py-1.5 rounded-lg border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Assigned to You ({roleScopedTasks.length} Deliverables)</span>
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-soft flex flex-wrap items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Filter tasks by title or details..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
          />
        </div>

        {/* Custom Calendar Date Input */}
        <CustomDatePicker
          value={customDate}
          onChange={val => {
            setCustomDate(val);
            setSelectedDateScope('custom');
          }}
          placeholder="Custom Date"
        />

        {/* Date Scope Filter */}
        <CustomSelect
          value={selectedDateScope}
          onChange={val => setSelectedDateScope(val as any)}
          options={[
            { value: 'all', label: `All Dates (${totalScopeCount})` },
            { value: 'today', label: `⚡ Due Today (${todayTasksCount})` },
            { value: 'previous', label: `🕒 Previous (${previousTasksCount})` },
            { value: 'upcoming', label: `🚀 Upcoming (${upcomingTasksCount})` },
            { value: 'custom', label: `📅 Custom Day (${customDateTasksCount})` }
          ]}
        />

        {/* Project Filter */}
        <CustomSelect
          icon={<Folder className="w-3.5 h-3.5" />}
          value={selectedProjectFilter}
          onChange={val => setSelectedProjectFilter(val)}
          options={[
            { value: 'all', label: 'All Projects' },
            ...projects
              .filter(p => currentUser.role === 'manager' || p.members.includes(currentUser.id))
              .map(p => ({
                value: p.id,
                label: `[${p.key}] ${p.name}`
              }))
          ]}
        />

        {/* Status Filter */}
        <CustomSelect
          value={selectedStatus}
          onChange={val => setSelectedStatus(val)}
          options={[
            { value: 'all', label: 'All Statuses' },
            { value: 'todo', label: 'To Do' },
            { value: 'in_progress', label: 'In Progress' },
            { value: 'blocked', label: 'Blocked' },
            { value: 'completed', label: 'Completed' }
          ]}
        />

        {/* Assignee Filter: Managers can filter by any employee contributor; Employees are locked to their own tasks */}
        {currentUser.role === 'manager' ? (
          <CustomSelect
            value={selectedAssignee}
            onChange={val => setSelectedAssignee(val)}
            options={[
              { value: 'all', label: `All Team Members (${tasks.length})` },
              ...users
                .filter(u => u.role === 'employee')
                .map(u => ({
                  value: u.id,
                  label: `${u.name} (${tasks.filter(t => t.assigneeId === u.id).length} assigned)`
                }))
            ]}
          />
        ) : (
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-xl border border-emerald-200 bg-emerald-50/70 text-emerald-800 font-semibold shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Assigned to You</span>
          </div>
        )}

        {/* Priority Filter */}
        <CustomSelect
          value={selectedPriority}
          onChange={val => setSelectedPriority(val)}
          options={[
            { value: 'all', label: 'All Priorities' },
            { value: 'urgent', label: 'Urgent' },
            { value: 'high', label: 'High' },
            { value: 'medium', label: 'Medium' },
            { value: 'low', label: 'Low' }
          ]}
        />

        {/* Sort Order */}
        <CustomSelect
          icon={<ArrowUpDown className="w-3.5 h-3.5" />}
          value={sortBy}
          onChange={val => setSortBy(val as any)}
          options={[
            { value: 'date_desc', label: 'Date: Newest First' },
            { value: 'date_asc', label: 'Date: Oldest / Previous First' },
            { value: 'priority', label: 'Priority: Highest First' }
          ]}
        />

        {/* Clear Filters Button if any active */}
        {(search ||
          selectedStatus !== 'all' ||
          selectedProjectFilter !== 'all' ||
          selectedPriority !== 'all' ||
          selectedAssignee !== 'all' ||
          selectedDateScope !== 'all') && (
          <button
            onClick={() => {
              setSearch('');
              setSelectedStatus('all');
              setSelectedProjectFilter('all');
              setSelectedPriority('all');
              setSelectedAssignee('all');
              setSelectedDateScope('all');
            }}
            className="text-xs text-slate-500 hover:text-slate-800 font-semibold px-2 py-1"
          >
            Reset filters
          </button>
        )}
      </div>

      {/* Active Calendar Date Notification Banner */}
      {selectedDateScope === 'custom' && (
        <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-xl flex flex-wrap items-center justify-between gap-2 text-xs text-emerald-950 shadow-soft-sm">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-emerald-100/80 text-emerald-800">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-slate-900">
                Tasks for {formatCustomDateLabel(customDate)}
              </p>
              <p className="text-[11px] text-slate-600">
                {customDateTasksCount === 0
                  ? 'No deliverables scheduled for this calendar date. Pick another day or click below to view all.'
                  : `Showing ${customDateTasksCount} task${customDateTasksCount === 1 ? '' : 's'} scheduled for this date.`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleStepDay(-1)}
              className="px-2 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-[11px]"
            >
              ◀ Prev Day
            </button>
            <button
              onClick={() => handleStepDay(1)}
              className="px-2 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-[11px]"
            >
              Next Day ▶
            </button>
            <button
              onClick={() => setSelectedDateScope('all')}
              className="px-2.5 py-1 rounded-lg bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-100 font-semibold text-[11px] transition-colors"
            >
              View All Dates ✕
            </button>
          </div>
        </div>
      )}

      {/* Render Kanban Board View */}
      {viewMode === 'board' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {kanbanColumns.map(col => {
            const columnTasks = sortedTasks.filter(t => t.status === col.id);
            return (
              <div
                key={col.id}
                className="bg-slate-100/60 rounded-2xl p-3 border border-slate-200/80 flex flex-col min-h-[500px]"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-3 px-1 border-b border-slate-200/60 mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${col.dotColor}`} />
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      {col.label}
                    </h3>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-white text-slate-600 text-xs font-bold border border-slate-200">
                    {columnTasks.length}
                  </span>
                </div>

                {/* Cards List */}
                <div className="space-y-3 flex-1 overflow-y-auto">
                  {columnTasks.length === 0 ? (
                    <div className="h-32 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center text-xs text-slate-400">
                      No tasks in this stage
                    </div>
                  ) : (
                    columnTasks.map(task => {
                      const assignee = users.find(u => u.id === task.assigneeId);
                      const project = projects.find(p => p.id === task.projectId);
                      const isOverdue =
                        task.status !== 'completed' && isPastDate(task.dueDate);
                      const isPastDateVal = isPastDate(task.dueDate);
                      const isTodayVal = isToday(task.dueDate);
                      const isDone = task.status === 'completed';

                      return (
                        <div
                          key={task.id}
                          onClick={() => setSelectedTaskId(task.id)}
                          className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-soft hover:shadow-soft-md hover:border-emerald-300 transition-all cursor-pointer group space-y-2.5"
                        >
                          <div className="flex items-center justify-between gap-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-100">
                                TASK-{task.id.replace('task-', '')}
                              </span>
                              {project && (
                                <span
                                  className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200"
                                  title={`Project: ${project.name}`}
                                >
                                  {project.key}
                                </span>
                              )}
                            </div>
                            <PriorityBadge priority={task.priority} />
                          </div>

                          <h4 className="text-xs font-bold text-slate-900 leading-snug group-hover:text-emerald-800 transition-colors">
                            {task.title}
                          </h4>

                          {task.description && (
                            <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                              {task.description}
                            </p>
                          )}

                          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px]">
                            {/* Due date with previous date / assignment date */}
                            <div className="flex flex-col gap-0.5">
                              <span
                                className={`flex items-center gap-1 font-semibold ${
                                  isOverdue
                                    ? 'text-rose-600 font-bold'
                                    : isDone
                                    ? 'text-emerald-700'
                                    : isPastDateVal
                                    ? 'text-slate-600'
                                    : isTodayVal
                                    ? 'text-emerald-700 font-bold'
                                    : 'text-slate-500'
                                }`}
                              >
                                <Calendar className="w-3 h-3 text-slate-400" />
                                {isPastDateVal
                                  ? isDone
                                    ? `Past • ${task.dueDate}`
                                    : `Overdue • ${task.dueDate}`
                                  : isTodayVal
                                  ? 'Due Today'
                                  : `Due ${task.dueDate}`}
                              </span>
                              {task.createdAt && (
                                <span className="text-[10px] text-slate-400 pl-4">
                                  Assigned {new Date(task.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </span>
                              )}
                            </div>

                            {/* Assignee Avatar with presence */}
                            {assignee && (
                              <div
                                className="flex items-center gap-1.5 flex-shrink-0"
                                title={assignee.role !== 'manager' ? `Assigned to ${assignee.name} (${assignee.presence})` : `Assigned to ${assignee.name}`}
                              >
                                <span className="text-[10px] text-slate-500 font-medium hidden sm:inline">
                                  {assignee.name.split(' ')[0]}
                                </span>
                                <div className="relative">
                                  <img
                                    src={assignee.avatar}
                                    alt={assignee.name}
                                    className="w-5 h-5 rounded-full object-cover"
                                  />
                                  {assignee.role !== 'manager' && (
                                    <span className="absolute -bottom-0.5 -right-0.5">
                                      <PresenceBadge status={assignee.presence} variant="dot" size="sm" />
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Discuss in Group Chat button for employees on their tasks */}
                          {currentUser.role === 'employee' && task.assigneeId === currentUser.id && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDiscussInGroupChat(task);
                              }}
                              className="w-full mt-2.5 py-1.5 px-3 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/90 text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                              title="Discuss this task in group chat"
                            >
                              <MessageSquare className="w-3.5 h-3.5 text-emerald-700" />
                              <span>Discuss in Group Chat</span>
                            </button>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Render Table / List View */}
      {viewMode === 'table' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-soft overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-4 w-12 text-center">Status</th>
                  <th className="py-3 px-4">Task Deliverable</th>
                  <th className="py-3 px-4">Task ID & Tags</th>
                  <th className="py-3 px-4">Assignee</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Deadline</th>
                  {currentUser.role === 'employee' && (
                    <th className="py-3 px-4 text-right">Discussion</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {sortedTasks.length === 0 ? (
                  <tr>
                    <td colSpan={currentUser.role === 'employee' ? 7 : 6} className="py-8 text-center text-slate-400">
                      No matching tasks found for the selected date scope and filters.
                    </td>
                  </tr>
                ) : (
                  sortedTasks.map(task => {
                    const assignee = users.find(u => u.id === task.assigneeId);
                    const project = projects.find(p => p.id === task.projectId);
                    const isDone = task.status === 'completed';
                    const isPast = isPastDate(task.dueDate);
                    const isCurrentDay = isToday(task.dueDate);

                    return (
                      <tr
                        key={task.id}
                        onClick={() => setSelectedTaskId(task.id)}
                        className={`hover:bg-slate-50/80 cursor-pointer transition-colors ${
                          isDone ? 'bg-slate-50/40 text-slate-400' : ''
                        }`}
                      >
                        <td className="py-3 px-4 text-center" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={() =>
                              updateTaskStatus(
                                task.id,
                                isDone ? 'in_progress' : 'completed'
                              )
                            }
                            className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all mx-auto ${
                              isDone
                                ? 'bg-emerald-600 border-emerald-600 text-white'
                                : 'border-slate-300 hover:border-emerald-500 text-transparent'
                            }`}
                            title={isDone ? 'Mark as In Progress' : 'Mark Complete'}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </button>
                        </td>

                        <td className="py-3 px-4 font-semibold text-slate-900">
                          <span className={isDone ? 'line-through text-slate-400' : ''}>
                            {task.title}
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-100">
                              TASK-{task.id.replace('task-', '')}
                            </span>
                            {project && (
                              <span
                                className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200"
                                title={`Project: ${project.name}`}
                              >
                                {project.key}
                              </span>
                            )}
                            {task.tags && task.tags[0] && (
                              <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-medium">
                                #{task.tags[0]}
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          {assignee ? (
                            <div className="flex items-center gap-2">
                              <div className="relative">
                                <img
                                  src={assignee.avatar}
                                  alt={assignee.name}
                                  className="w-5 h-5 rounded-full object-cover"
                                />
                                {assignee.role !== 'manager' && (
                                  <span className="absolute -bottom-0.5 -right-0.5">
                                    <PresenceBadge status={assignee.presence} variant="dot" size="sm" />
                                  </span>
                                )}
                              </div>
                              <span className="font-medium text-slate-700">{assignee.name}</span>
                            </div>
                          ) : (
                            <span className="text-slate-400">Unassigned</span>
                          )}
                        </td>

                        <td className="py-3 px-4">
                          <PriorityBadge priority={task.priority} />
                        </td>

                        <td className="py-3 px-4">
                          <div className="flex flex-col">
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`font-semibold text-xs ${
                                  isPast
                                    ? isDone
                                      ? 'text-emerald-700'
                                      : 'text-rose-600 font-bold'
                                    : isCurrentDay
                                    ? 'text-emerald-800 font-bold'
                                    : 'text-slate-700'
                                }`}
                              >
                                {task.dueDate}
                              </span>
                              {isPast && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase bg-amber-50 text-amber-800 border border-amber-200">
                                  Previous Date
                                </span>
                              )}
                              {isCurrentDay && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase bg-emerald-50 text-emerald-800 border border-emerald-200">
                                  Today
                                </span>
                              )}
                            </div>
                            {task.createdAt && (
                              <span className="text-[10px] text-slate-400">
                                Assigned {new Date(task.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </span>
                            )}
                          </div>
                        </td>

                        {currentUser.role === 'employee' && (
                          <td className="py-3 px-4 text-right" onClick={e => e.stopPropagation()}>
                            {task.assigneeId === currentUser.id && (
                              <button
                                onClick={() => handleDiscussInGroupChat(task)}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                                title="Discuss in Group Chat"
                              >
                                <MessageSquare className="w-3.5 h-3.5 text-emerald-700" />
                                <span className="hidden sm:inline">Discuss in Group Chat</span>
                              </button>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
