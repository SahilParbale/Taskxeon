import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { TaskPriority } from '../../types';
import { X, Calendar, Flag, UserCheck, Sparkles, FolderKanban } from 'lucide-react';

import { formatDateToYYYYMMDD, getTodayDateString } from '../../lib/dateUtils';
import { CustomSelect } from './CustomSelect';
import { CustomDatePicker } from './CustomDatePicker';

export const CreateTaskModal: React.FC = () => {
  const {
    isCreateModalOpen,
    setIsCreateModalOpen,
    createTask,
    users,
    projects,
    selectedProjectId,
    currentUser
  } = useApp();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [projectId, setProjectId] = useState<string>('');
  const [assigneeId, setAssigneeId] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [dueDate, setDueDate] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [error, setError] = useState('');

  // Set default values when modal opens
  useEffect(() => {
    if (isCreateModalOpen) {
      // Default project to selectedProjectId if available, or first project
      if (selectedProjectId) {
        setProjectId(selectedProjectId);
      } else if (projects.length > 0 && !projectId) {
        setProjectId(projects[0].id);
      }

      // Default assignee strictly to an employee contributor in current department
      const employeeContributors = users.filter(u => u.role === 'employee');
      if (!assigneeId || !employeeContributors.some(e => e.id === assigneeId)) {
        const defaultEmp = employeeContributors[0];
        if (defaultEmp) {
          setAssigneeId(defaultEmp.id);
        }
      }
      // Default due date to 3 days from now in local time
      if (!dueDate) {
        const future = new Date();
        future.setDate(future.getDate() + 3);
        setDueDate(formatDateToYYYYMMDD(future));
      }
    }
  }, [isCreateModalOpen, selectedProjectId, projects, users, currentUser]);

  if (!isCreateModalOpen || currentUser.role !== 'manager') return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentUser.role !== 'manager') {
      setError('Employees are not authorized to create or assign tasks.');
      return;
    }
    if (!title.trim()) {
      setError('Task title is required');
      return;
    }
    if (!assigneeId) {
      setError('Please assign this task to a team member');
      return;
    }

    const tags = tagsInput
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);

    createTask({
      title: title.trim(),
      description: description.trim(),
      projectId: projectId || undefined,
      assigneeId,
      priority,
      dueDate: dueDate || getTodayDateString(),
      tags
    });

    // Reset and close
    setTitle('');
    setDescription('');
    setTagsInput('');
    setError('');
    setIsCreateModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity"
        onClick={() => setIsCreateModalOpen(false)}
      />

      <div className="flex min-h-full items-center justify-center p-3 sm:p-6 text-center">
        <div className="relative w-full max-w-xl transform rounded-2xl bg-white text-left shadow-2xl transition-all border border-slate-200 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 px-4 sm:px-6 py-3.5 sm:py-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-700 flex-shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base sm:text-lg font-semibold text-slate-900 truncate">Assign Task to Team Member</h3>
                <p className="text-xs text-slate-500 truncate">Allocate a new deliverable to an employee contributor</p>
              </div>
            </div>
            <button
              onClick={() => setIsCreateModalOpen(false)}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer flex-shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 max-h-[calc(90vh-80px)] overflow-y-auto">
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs font-medium">
                {error}
              </div>
            )}

            {/* Title */}
            <div>
              <label htmlFor="task-title" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Task Title *
              </label>
              <input
                id="task-title"
                type="text"
                value={title}
                onChange={e => {
                  setTitle(e.target.value);
                  setError('');
                }}
                placeholder="e.g., Audit RBAC permissions and sign off SOC2 matrix"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-sm transition-all"
                autoFocus
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="task-desc" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Description
              </label>
              <textarea
                id="task-desc"
                rows={3}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Provide context, acceptance criteria, or relevant links..."
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-sm transition-all resize-none"
              />
            </div>

            {/* Associated Project */}
            <div>
              <label htmlFor="task-project" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <FolderKanban className="w-3.5 h-3.5 text-slate-500" />
                  Associated Project
                </span>
                <span className="text-[10px] text-emerald-700 font-semibold lowercase">
                  (reflects live on project page)
                </span>
              </label>
              <CustomSelect
                value={projectId}
                onChange={val => setProjectId(val)}
                className="w-full"
                buttonClassName="w-full py-2.5 px-3.5 text-xs sm:text-sm font-medium"
                options={[
                  { value: '', label: 'No Project (Standalone Task)' },
                  ...projects.map(p => ({
                    value: p.id,
                    label: `[${p.key}] ${p.name}`
                  }))
                ]}
              />
            </div>

            {/* Assignee & Due Date row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Assignee with presence */}
              <div>
                <label htmlFor="task-assignee" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5 text-slate-500" />
                  Assign To (Employee) *
                </label>
                <CustomSelect
                  value={assigneeId}
                  onChange={val => setAssigneeId(val)}
                  className="w-full"
                  buttonClassName="w-full py-2.5 px-3.5 text-xs sm:text-sm font-medium"
                  options={users
                    .filter(u => u.role === 'employee')
                    .map(u => ({
                      value: u.id,
                      label: `${u.name} (${u.title}) — ${u.presence.toUpperCase()}`
                    }))}
                />
              </div>

              {/* Due Date */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  Due Date
                </label>
                <CustomDatePicker
                  value={dueDate}
                  onChange={val => setDueDate(val)}
                  className="w-full"
                  buttonClassName="w-full py-2.5 px-3.5 text-xs sm:text-sm font-medium"
                />
              </div>
            </div>

            {/* Priority selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Flag className="w-3.5 h-3.5 text-slate-500" />
                Task Priority
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(['low', 'medium', 'high', 'urgent'] as TaskPriority[]).map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`py-2 text-xs font-medium rounded-lg border capitalize transition-all ${
                      priority === p
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800 font-semibold ring-1 ring-emerald-600'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Tags */}
            <div>
              <label htmlFor="task-tags" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Tags (comma separated)
              </label>
              <input
                id="task-tags"
                type="text"
                value={tagsInput}
                onChange={e => setTagsInput(e.target.value)}
                placeholder={currentUser.department && currentUser.department.toLowerCase().includes('market') ? 'e.g. Campaign, SEO, Content, Social Media' : 'e.g. API, Frontend, Bug Fix, DevOps'}
                className="w-full px-3.5 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-sm transition-all"
              />
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm hover:shadow transition-all"
              >
                <Sparkles className="w-4 h-4" />
                Assign Task
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
