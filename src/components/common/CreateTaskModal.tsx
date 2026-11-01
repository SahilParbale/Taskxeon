import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { TaskPriority, TaskStatus } from '../../types';
import {
  X,
  Calendar,
  Flag,
  UserCheck,
  Sparkles,
  FolderKanban,
  Phone,
  MapPin,
  Presentation,
  Building2,
  User as UserIcon,
  PhoneCall
} from 'lucide-react';

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

  const isMarketing = !!(currentUser.department && currentUser.department.toLowerCase().includes('market'));

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [projectId, setProjectId] = useState<string>('');
  const [assigneeId, setAssigneeId] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [dueDate, setDueDate] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [error, setError] = useState('');

  // Marketing-specific workflow fields
  const [stage, setStage] = useState<TaskStatus>('calling');
  const [clientContact, setClientContact] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientLocation, setClientLocation] = useState('');

  // Set default values when modal opens
  useEffect(() => {
    if (isCreateModalOpen) {
      if (selectedProjectId) {
        setProjectId(selectedProjectId);
      } else if (projects.length > 0 && !projectId) {
        setProjectId(projects[0].id);
      }

      const employeeContributors = users.filter(u => u.role === 'employee');
      if (!assigneeId || !employeeContributors.some(e => e.id === assigneeId)) {
        const defaultEmp = employeeContributors[0];
        if (defaultEmp) {
          setAssigneeId(defaultEmp.id);
        }
      }

      if (!dueDate) {
        const future = new Date();
        future.setDate(future.getDate() + 2);
        setDueDate(formatDateToYYYYMMDD(future));
      }

      if (isMarketing) {
        setStage('calling');
      }
    }
  }, [isCreateModalOpen, selectedProjectId, projects, users, currentUser, isMarketing]);

  if (!isCreateModalOpen || currentUser.role !== 'manager') return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentUser.role !== 'manager') {
      setError('Employees are not authorized to schedule work.');
      return;
    }
    if (!title.trim()) {
      setError(isMarketing ? 'Client or company name is required' : 'Task title is required');
      return;
    }
    if (!assigneeId) {
      setError('Please assign this to a team member');
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
      status: isMarketing ? stage : 'todo',
      dueDate: dueDate || getTodayDateString(),
      tags: tags.length > 0 ? tags : (isMarketing ? [stage === 'calling' ? 'Calling' : stage === 'field_visit' ? 'Field Visit' : 'Product Demo'] : undefined),
      clientContact: isMarketing ? clientContact.trim() : undefined,
      clientPhone: isMarketing ? clientPhone.trim() : undefined,
      clientLocation: isMarketing ? clientLocation.trim() : undefined
    });

    // Reset and close
    setTitle('');
    setDescription('');
    setTagsInput('');
    setClientContact('');
    setClientPhone('');
    setClientLocation('');
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
                {isMarketing ? <PhoneCall className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
              </div>
              <div className="min-w-0">
                <h3 className="text-base sm:text-lg font-semibold text-slate-900 truncate">
                  {isMarketing ? 'Schedule Client Engagement / Field Lead' : 'Assign Task to Team Member'}
                </h3>
                <p className="text-xs text-slate-500 truncate">
                  {isMarketing
                    ? 'Schedule client outreach calls, on-site field visits, or product demos'
                    : 'Allocate a new deliverable to an employee contributor'}
                </p>
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

            {/* Title / Client Company Name */}
            <div>
              <label htmlFor="task-title" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                {isMarketing ? <Building2 className="w-3.5 h-3.5 text-slate-500" /> : null}
                <span>{isMarketing ? 'Client / Company Name *' : 'Task Title *'}</span>
              </label>
              <input
                id="task-title"
                type="text"
                value={title}
                onChange={e => {
                  setTitle(e.target.value);
                  setError('');
                }}
                placeholder={
                  isMarketing
                    ? 'e.g., Zenith Logistics & Supply or Reliance Retail Hub'
                    : 'e.g., Audit RBAC permissions and sign off SOC2 matrix'
                }
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-sm transition-all"
                autoFocus
              />
            </div>

            {/* Marketing Stage Selector */}
            {isMarketing && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Initial Engagement Stage
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setStage('calling')}
                    className={`py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      stage === 'calling'
                        ? 'border-sky-500 bg-sky-50 text-sky-900 ring-1 ring-sky-500'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Phone className="w-3.5 h-3.5 text-sky-600" />
                    <span>Calling</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setStage('field_visit')}
                    className={`py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      stage === 'field_visit'
                        ? 'border-amber-500 bg-amber-50 text-amber-900 ring-1 ring-amber-500'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <MapPin className="w-3.5 h-3.5 text-amber-600" />
                    <span>Field Visit</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setStage('demo')}
                    className={`py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      stage === 'demo'
                        ? 'border-purple-500 bg-purple-50 text-purple-900 ring-1 ring-purple-500'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Presentation className="w-3.5 h-3.5 text-purple-600" />
                    <span>Product Demo</span>
                  </button>
                </div>
              </div>
            )}

            {/* Marketing Client Contact & Phone */}
            {isMarketing && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="client-contact" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <UserIcon className="w-3.5 h-3.5 text-slate-500" />
                    <span>Contact Person</span>
                  </label>
                  <input
                    id="client-contact"
                    type="text"
                    value={clientContact}
                    onChange={e => setClientContact(e.target.value)}
                    placeholder="e.g., Rajesh Iyer (Director)"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-sm transition-all"
                  />
                </div>
                <div>
                  <label htmlFor="client-phone" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-slate-500" />
                    <span>Phone Number</span>
                  </label>
                  <input
                    id="client-phone"
                    type="tel"
                    value={clientPhone}
                    onChange={e => setClientPhone(e.target.value)}
                    placeholder="e.g., +91 98200 12345"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-sm transition-all"
                  />
                </div>
              </div>
            )}

            {/* Marketing Location */}
            {isMarketing && (
              <div>
                <label htmlFor="client-location" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-500" />
                  <span>Meeting Location / Site Address</span>
                </label>
                <input
                  id="client-location"
                  type="text"
                  value={clientLocation}
                  onChange={e => setClientLocation(e.target.value)}
                  placeholder="e.g., BKC Complex, Bandra Kurla Complex, Mumbai"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-sm transition-all"
                />
              </div>
            )}

            {/* Description / Objectives */}
            <div>
              <label htmlFor="task-desc" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                {isMarketing ? 'Engagement Objectives / Notes' : 'Description'}
              </label>
              <textarea
                id="task-desc"
                rows={3}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder={
                  isMarketing
                    ? 'Outline meeting objectives, agenda, questions, or target contract value...'
                    : 'Provide context, acceptance criteria, or relevant links...'
                }
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-sm transition-all resize-none"
              />
            </div>

            {/* Associated Product / Project */}
            <div>
              <label htmlFor="task-project" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <FolderKanban className="w-3.5 h-3.5 text-slate-500" />
                  {isMarketing ? 'Target Product' : 'Associated Project'}
                </span>
                <span className="text-[10px] text-emerald-700 font-semibold lowercase">
                  (reflects live on {isMarketing ? 'product' : 'project'} page)
                </span>
              </label>
              <CustomSelect
                value={projectId}
                onChange={val => setProjectId(val)}
                className="w-full"
                buttonClassName="w-full py-2.5 px-3.5 text-xs sm:text-sm font-medium"
                options={[
                  { value: '', label: isMarketing ? 'No Product (Independent Lead)' : 'No Project (Standalone Task)' },
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
                  <span>{isMarketing ? 'Assign Representative *' : 'Assign To (Employee) *'}</span>
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

              {/* Scheduled Date / Due Date */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  <span>{isMarketing ? 'Scheduled Meeting / Due Date' : 'Due Date'}</span>
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
                <span>{isMarketing ? 'Engagement Priority' : 'Task Priority'}</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(['low', 'medium', 'high', 'urgent'] as TaskPriority[]).map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`py-2 text-xs font-medium rounded-lg border capitalize transition-all cursor-pointer ${
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
                placeholder={isMarketing ? 'e.g. Enterprise, Healthcare, Logistics, Inbound' : 'e.g. API, Frontend, Bug Fix, DevOps'}
                className="w-full px-3.5 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-sm transition-all"
              />
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm hover:shadow transition-all cursor-pointer"
              >
                {isMarketing ? <PhoneCall className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                <span>{isMarketing ? 'Schedule Engagement' : 'Assign Task'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
