import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { TaskStatus, TaskPriority } from '../../types';
import { PriorityBadge } from './PriorityBadge';
import { StatusBadge } from './StatusBadge';
import { PresenceBadge } from './PresenceBadge';
import {
  X,
  Calendar,
  Folder,
  Trash2,
  CheckCircle2,
  Clock,
  AlertOctagon,
  UserCheck,
  Tag,
  ArrowRight,
  MessageSquare,
  Phone,
  MapPin,
  Presentation,
  Building2,
  User as UserIcon,
  PhoneCall
} from 'lucide-react';
import { isToday, isPastDate } from '../../lib/dateUtils';
import { CustomSelect } from './CustomSelect';
import { CustomDatePicker } from './CustomDatePicker';

export const TaskDetailModal: React.FC = () => {
  const {
    selectedTaskId,
    setSelectedTaskId,
    tasks,
    projects,
    users,
    currentUser,
    updateTaskStatus,
    updateTask,
    deleteTask,
    openConfirmModal,
    setCurrentView,
    sendMessage
  } = useApp();

  const task = tasks.find(t => t.id === selectedTaskId);

  const isMarketing = !!(
    (task && task.department && task.department.toLowerCase().includes('market')) ||
    (currentUser.department && currentUser.department.toLowerCase().includes('market'))
  );

  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editPriority, setEditPriority] = useState<TaskPriority>('medium');
  const [editAssigneeId, setEditAssigneeId] = useState('');
  const [editProjectId, setEditProjectId] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const [editClientContact, setEditClientContact] = useState('');
  const [editClientPhone, setEditClientPhone] = useState('');
  const [editClientLocation, setEditClientLocation] = useState('');
  const [editStageOutcome, setEditStageOutcome] = useState('');

  useEffect(() => {
    if (task) {
      setEditTitle(task.title);
      setEditDesc(task.description);
      setEditPriority(task.priority);
      setEditAssigneeId(task.assigneeId);
      setEditProjectId(task.projectId || '');
      setEditDueDate(task.dueDate);
      setEditClientContact(task.clientContact || '');
      setEditClientPhone(task.clientPhone || '');
      setEditClientLocation(task.clientLocation || '');
      setEditStageOutcome(task.stageOutcome || '');
      setIsEditing(false);
    }
  }, [task]);

  const isTaskAssignedToUser = (
    t: { assigneeId: string },
    u: { id: string; email?: string; name?: string; username?: string }
  ): boolean => {
    if (!t || !t.assigneeId || !u) return false;
    const tAssignee = String(t.assigneeId).trim().toLowerCase();
    const uId = String(u.id).trim().toLowerCase();
    const uEmail = u.email ? u.email.trim().toLowerCase() : '';
    const uName = u.name ? u.name.trim().toLowerCase() : '';
    const uUsername = u.username ? u.username.trim().toLowerCase() : '';

    if (tAssignee === uId) return true;
    if (uEmail && tAssignee === uEmail) return true;
    if (uUsername && tAssignee === uUsername) return true;

    const isUserAarav = uId === 'user-marketing-emp' || uEmail.includes('aarav') || uName.includes('aarav') || uUsername === 'aarav';
    const isTaskAssignedAarav = tAssignee === 'user-marketing-emp' || tAssignee.includes('aarav') || tAssignee === 'aarav.mehta@taskflow.io';
    if (isUserAarav && isTaskAssignedAarav) return true;

    const isUserSahil = uId === 'user-2' || uEmail.includes('sahil') || uName.includes('sahil') || uUsername === 'sahil';
    const isTaskAssignedSahil = tAssignee === 'user-2' || tAssignee.includes('sahil') || tAssignee === 'sahilparbale@gmail.com';
    if (isUserSahil && isTaskAssignedSahil) return true;

    return false;
  };

  if (!task) return null;
  // Role-based visibility check: employees can only inspect tasks assigned to them
  if (currentUser.role === 'employee' && !isTaskAssignedToUser(task, currentUser)) return null;

  const project = projects.find(p => p.id === task.projectId);
  const assignee = users.find(u => u.id === task.assigneeId);
  const creator = users.find(u => u.id === task.createdById);

  const handleSaveEdits = () => {
    updateTask(task.id, {
      title: editTitle,
      description: editDesc,
      priority: editPriority,
      assigneeId: editAssigneeId,
      projectId: editProjectId || undefined,
      dueDate: editDueDate,
      clientContact: isMarketing ? editClientContact : task.clientContact,
      clientPhone: isMarketing ? editClientPhone : task.clientPhone,
      clientLocation: isMarketing ? editClientLocation : task.clientLocation,
      stageOutcome: isMarketing ? editStageOutcome : task.stageOutcome
    });
    setIsEditing(false);
  };

  const isCompleted = task.status === 'completed';

  const pipelineStages: { id: TaskStatus; label: string }[] = isMarketing
    ? [
        { id: 'calling', label: 'Calling' },
        { id: 'field_visit', label: 'Field Visit' },
        { id: 'demo', label: 'Product Demo' },
        { id: 'completed', label: 'Closed / Won' }
      ]
    : [
        { id: 'todo', label: 'To Do' },
        { id: 'in_progress', label: 'In Progress' },
        { id: 'blocked', label: 'Blocked' },
        { id: 'completed', label: 'Completed' }
      ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity"
        onClick={() => setSelectedTaskId(null)}
      />

      <div className="flex min-h-full items-center justify-center p-3 sm:p-6 text-center">
        <div className="relative w-full max-w-2xl transform rounded-2xl bg-white text-left shadow-2xl transition-all border border-slate-200 overflow-hidden">
          {/* Top banner / header */}
          <div className="flex items-center justify-between border-b border-slate-100 px-4 sm:px-6 py-3.5 sm:py-4 bg-slate-50/60">
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <span className="font-mono text-[11px] sm:text-xs font-semibold px-2 py-0.5 rounded bg-slate-200/70 text-slate-700">
                {isMarketing
                  ? `LEAD-${task.id.replace('lead-', '').replace('task-', '')}`
                  : `TASK-${task.id.replace('task-', '')}`}
              </span>
              <StatusBadge status={task.status} />
              <PriorityBadge priority={task.priority} />
            </div>
            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              {currentUser.role === 'manager' && (
                <button
                  onClick={() => {
                    openConfirmModal({
                      title: isMarketing ? 'Delete Client Lead' : 'Delete Task',
                      message: isMarketing
                        ? `Are you sure you want to delete lead "${task.title}"? This will permanently remove the lead contact information and stage records.`
                        : `Are you sure you want to delete task "${task.title}"? This action cannot be undone.`,
                      confirmText: isMarketing ? 'Delete Lead' : 'Delete Task',
                      confirmVariant: 'danger',
                      onConfirm: () => {
                        deleteTask(task.id);
                        setSelectedTaskId(null);
                      }
                    });
                  }}
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                  title={isMarketing ? 'Delete Lead' : 'Delete Task'}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => setSelectedTaskId(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200/60 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Modal Body */}
          <div className="p-4 sm:p-6 space-y-6 max-h-[calc(90vh-80px)] overflow-y-auto">
            {/* Quick Complete / Status Action Bar */}
            <div className="bg-emerald-50/60 border border-emerald-100 rounded-xl p-3 sm:p-3.5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-900">
                  {isMarketing ? 'Pipeline Stage:' : 'Update Status:'}
                </span>
                <div className="inline-flex rounded-lg border border-emerald-200 bg-white p-0.5 shadow-sm flex-wrap">
                  {pipelineStages.map(st => {
                    const active = task.status === st.id;
                    return (
                      <button
                        key={st.id}
                        onClick={() => updateTaskStatus(task.id, st.id)}
                        className={`px-2.5 sm:px-3 py-1 text-[11px] sm:text-xs font-medium rounded-md transition-all cursor-pointer ${
                          active
                            ? 'bg-emerald-600 text-white shadow-sm font-semibold'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                        }`}
                      >
                        {st.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap w-full sm:w-auto justify-end">
                <button
                  onClick={() => {
                    setSelectedTaskId(null);
                    const channel = isMarketing ? 'ch-marketing' : 'ch-engineering';
                    sendMessage(
                      isMarketing
                        ? `Let's coordinate on client lead "${task.title}" (Stage: ${task.status.toUpperCase()} | Meeting: ${task.dueDate} | Contact: ${task.clientContact || 'N/A'})`
                        : `Let's discuss task "${task.title}" (Due: ${task.dueDate} | Priority: ${task.priority.toUpperCase()})`,
                      channel
                    );
                    setCurrentView('messages');
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-bold shadow-2xs hover:shadow-soft transition-all cursor-pointer"
                  title="Open Chat to coordinate on this"
                >
                  <MessageSquare className="w-4 h-4 text-emerald-700" />
                  <span>{isMarketing ? 'Discuss in Marketing Chat' : 'Discuss in Group Chat'}</span>
                </button>

                {!isCompleted && (
                  <button
                    onClick={() => updateTaskStatus(task.id, 'completed')}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm hover:shadow transition-all cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isMarketing ? 'Mark Closed / Won' : 'Mark Complete'}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Title & Description */}
            {/* Title & Description */}
            {!isEditing ? (
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <h2 className="text-xl font-bold text-slate-900 leading-snug">
                    {task.title}
                  </h2>
                  {(currentUser.role === 'manager' || (isMarketing && isTaskAssignedToUser(task, currentUser))) && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold hover:underline flex-shrink-0 pt-1 cursor-pointer"
                    >
                      {isMarketing ? 'Edit / Log Outcome' : 'Edit details'}
                    </button>
                  )}
                </div>

                {/* Marketing Client Metadata Bar */}
                {isMarketing && (
                  <div className="space-y-2.5">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">Contact Person</span>
                        <p className="text-xs font-semibold text-slate-800 flex items-center gap-1.5 mt-0.5">
                          <UserIcon className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                          <span className="truncate">{task.clientContact || 'Not specified'}</span>
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">Client Phone</span>
                        {task.clientPhone ? (
                          <a
                            href={`tel:${task.clientPhone}`}
                            className="text-xs font-semibold text-sky-700 hover:text-sky-900 flex items-center gap-1.5 mt-0.5 hover:underline"
                          >
                            <Phone className="w-3.5 h-3.5 text-sky-600 flex-shrink-0" />
                            <span>{task.clientPhone}</span>
                          </a>
                        ) : (
                          <span className="text-xs text-slate-400 mt-0.5 block">No phone number</span>
                        )}
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">Meeting Location</span>
                        <p className="text-xs font-semibold text-slate-800 flex items-center gap-1.5 mt-0.5">
                          <MapPin className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                          <span className="truncate">{task.clientLocation || 'Remote / Unspecified'}</span>
                        </p>
                      </div>
                    </div>

                    {/* Stage Outcome / Follow-up Notes Callout */}
                    {task.stageOutcome && (
                      <div className="p-3 rounded-xl bg-emerald-50/80 border border-emerald-200/90 text-xs">
                        <span className="text-[10px] uppercase font-bold text-emerald-900 block tracking-wider mb-0.5">
                          Stage Outcome / Call & Meeting Notes
                        </span>
                        <p className="text-emerald-950 font-medium whitespace-pre-wrap leading-relaxed">
                          {task.stageOutcome}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                  {task.description || (isMarketing ? 'No engagement objectives or notes provided.' : 'No detailed description provided.')}
                </p>
              </div>
            ) : (
              <div className="space-y-3 border p-4 rounded-xl border-emerald-200 bg-slate-50/50">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {isMarketing ? 'Client / Company Name' : 'Title'}
                  </label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={e => setEditTitle(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />
                </div>

                {isMarketing && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Person</label>
                      <input
                        type="text"
                        value={editClientContact}
                        onChange={e => setEditClientContact(e.target.value)}
                        placeholder="e.g. Sunil Nair (Director)"
                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                      <input
                        type="tel"
                        value={editClientPhone}
                        onChange={e => setEditClientPhone(e.target.value)}
                        placeholder="e.g. +91 98200 12345"
                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                      />
                    </div>
                  </div>
                )}

                {isMarketing && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Meeting Location</label>
                    <input
                      type="text"
                      value={editClientLocation}
                      onChange={e => setEditClientLocation(e.target.value)}
                      placeholder="e.g. BKC Complex, Mumbai"
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                    />
                  </div>
                )}

                {isMarketing && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Stage Outcome / Call & Meeting Notes
                    </label>
                    <textarea
                      rows={2}
                      value={editStageOutcome}
                      onChange={e => setEditStageOutcome(e.target.value)}
                      placeholder="e.g., Client requested on-site demonstration for 50 licenses next week; agreed on pricing tier."
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 resize-none"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {isMarketing ? 'Engagement Objectives / Notes' : 'Description'}
                  </label>
                  <textarea
                    rows={3}
                    value={editDesc}
                    onChange={e => setEditDesc(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 resize-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Priority</label>
                    <CustomSelect
                      value={editPriority}
                      onChange={val => setEditPriority(val as TaskPriority)}
                      className="w-full"
                      buttonClassName="w-full"
                      options={[
                        { value: 'low', label: 'Low' },
                        { value: 'medium', label: 'Medium' },
                        { value: 'high', label: 'High' },
                        { value: 'urgent', label: 'Urgent' }
                      ]}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {isMarketing ? 'Scheduled Date' : 'Due Date'}
                    </label>
                    <CustomDatePicker
                      value={editDueDate}
                      onChange={val => setEditDueDate(val)}
                      className="w-full"
                      buttonClassName="w-full"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {isMarketing ? 'Target Product' : 'Associated Project'}
                  </label>
                  <CustomSelect
                    value={editProjectId}
                    onChange={val => setEditProjectId(val)}
                    className="w-full"
                    buttonClassName="w-full"
                    options={[
                      { value: '', label: isMarketing ? 'No Product (Independent Lead)' : 'No Project (Standalone Task)' },
                      ...projects.map(p => ({
                        value: p.id,
                        label: `[${p.key}] ${p.name}`
                      }))
                    ]}
                  />
                </div>

                {currentUser.role === 'manager' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {isMarketing ? 'Reassign Representative' : 'Reassign to Employee'}
                    </label>
                    <CustomSelect
                      value={editAssigneeId}
                      onChange={val => setEditAssigneeId(val)}
                      className="w-full"
                      buttonClassName="w-full"
                      options={users
                        .filter(u => u.role === 'employee')
                        .map(u => ({
                          value: u.id,
                          label: `${u.name} (${u.title})`
                        }))}
                    />
                  </div>
                )}
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-lg cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveEdits}
                    className="px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm cursor-pointer"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            )}

            {/* Meta Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-100 pt-5 text-xs">
              {/* Associated Project */}
              <div className="flex items-center gap-2 p-3 rounded-lg bg-slate-50 border border-slate-100">
                <Folder className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Associated Project</span>
                  {project ? (
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-100/80 text-emerald-900 border border-emerald-300">
                        {project.key}
                      </span>
                      <span className="font-semibold text-slate-800 truncate" title={project.name}>
                        {project.name}
                      </span>
                    </div>
                  ) : (
                    <span className="font-semibold text-slate-500">Standalone Deliverable</span>
                  )}
                </div>
              </div>

              {/* Due Date & Assignment */}
              <div className="flex items-center gap-2 p-3 rounded-lg bg-slate-50 border border-slate-100">
                <Calendar className="w-4 h-4 text-slate-500" />
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Deadline & Assignment</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-slate-800">{task.dueDate}</span>
                    {isPastDate(task.dueDate) && (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase bg-amber-50 text-amber-800 border border-amber-200">
                        Previous Date
                      </span>
                    )}
                    {isToday(task.dueDate) && (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase bg-emerald-50 text-emerald-800 border border-emerald-200">
                        Today
                      </span>
                    )}
                  </div>
                  {task.createdAt && (
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      Assigned on {new Date(task.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  )}
                </div>
              </div>

              {/* Assignee Card with presence */}
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold mb-1.5">
                  Assignee
                </span>
                {assignee ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="relative">
                        <img
                          src={assignee.avatar}
                          alt={assignee.name}
                          className="w-7 h-7 rounded-full object-cover ring-1 ring-slate-200"
                        />
                        {assignee.role !== 'manager' && (
                          <span className="absolute -bottom-0.5 -right-0.5">
                            <PresenceBadge status={assignee.presence} variant="dot" size="sm" />
                          </span>
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 leading-tight">{assignee.name}</p>
                        <p className="text-[11px] text-slate-500">{assignee.title}</p>
                      </div>
                    </div>
                    {assignee.role !== 'manager' && (
                      <PresenceBadge status={assignee.presence} variant="pill" size="sm" />
                    )}
                  </div>
                ) : (
                  <span className="text-slate-400">Unassigned</span>
                )}
              </div>

              {/* Created By Card */}
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold mb-1.5">
                  Created By
                </span>
                {creator ? (
                  <div className="flex items-center gap-2.5">
                    <img
                      src={creator.avatar}
                      alt={creator.name}
                      className="w-7 h-7 rounded-full object-cover ring-1 ring-slate-200"
                    />
                    <div>
                      <p className="font-semibold text-slate-900 leading-tight">{creator.name}</p>
                      <p className="text-[11px] text-slate-500">{creator.role.toUpperCase()}</p>
                    </div>
                  </div>
                ) : (
                  <span className="text-slate-400">System</span>
                )}
              </div>
            </div>

            {/* Tags */}
            {task.tags && task.tags.filter(t => !t.startsWith('stage:') && !t.startsWith('mkt_')).length > 0 && (
              <div className="flex items-center gap-2 flex-wrap pt-2">
                <Tag className="w-3.5 h-3.5 text-slate-400" />
                {task.tags
                  .filter(t => !t.startsWith('stage:') && !t.startsWith('mkt_'))
                  .map(tag => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200"
                    >
                      #{tag}
                    </span>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
