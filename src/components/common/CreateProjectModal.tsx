import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { ProjectHealth } from '../../types';
import { formatDateToYYYYMMDD } from '../../lib/dateUtils';
import { CustomDatePicker } from './CustomDatePicker';
import { PresenceBadge } from './PresenceBadge';
import {
  X,
  FolderPlus,
  Calendar,
  Layers,
  Sparkles,
  Users,
  Shield,
  Sliders
} from 'lucide-react';

export const CreateProjectModal: React.FC = () => {
  const {
    isCreateProjectModalOpen,
    setIsCreateProjectModalOpen,
    createProject,
    users,
    currentUser
  } = useApp();

  const [name, setName] = useState('');
  const [key, setKey] = useState('');
  const [keyManuallyEdited, setKeyManuallyEdited] = useState(false);
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [health, setHealth] = useState<ProjectHealth>('on_track');
  const [initialProgress, setInitialProgress] = useState(0);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [error, setError] = useState('');

  // Default values when modal opens
  useEffect(() => {
    if (isCreateProjectModalOpen) {
      setName('');
      setKey('');
      setKeyManuallyEdited(false);
      setDescription('');
      setHealth('on_track');
      setInitialProgress(0);
      setError('');

      // Default deadline to 30 days ahead
      const future = new Date();
      future.setDate(future.getDate() + 30);
      setDeadline(formatDateToYYYYMMDD(future));

      // Default members: manager only initially
      setSelectedMemberIds([currentUser.id]);
    }
  }, [isCreateProjectModalOpen, currentUser.id]);

  if (!isCreateProjectModalOpen || currentUser.role !== 'manager') return null;

  // Auto-generate 2-4 letter uppercase key from name
  const handleNameChange = (val: string) => {
    setName(val);
    setError('');
    if (!keyManuallyEdited) {
      const generated = val
        .split(' ')
        .filter(w => w.length > 0)
        .map(w => w[0].toUpperCase())
        .join('')
        .slice(0, 4);
      setKey(generated);
    }
  };

  const toggleMember = (userId: string) => {
    setSelectedMemberIds(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentUser.role !== 'manager') {
      setError('Only Managers are authorized to create new project initiatives.');
      return;
    }
    if (!name.trim()) {
      setError('Project name is required');
      return;
    }
    if (!key.trim()) {
      setError('Project code key is required (e.g. SEC, INF)');
      return;
    }
    if (!deadline) {
      setError('Target deadline is required');
      return;
    }

    createProject({
      name: name.trim(),
      key: key.trim().toUpperCase(),
      description: description.trim() || 'Strategic software engineering initiative.',
      health,
      deadline,
      members: selectedMemberIds.length > 0 ? selectedMemberIds : [currentUser.id],
      initialProgress
    });

    setIsCreateProjectModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity"
        onClick={() => setIsCreateProjectModalOpen(false)}
      />

      <div className="flex min-h-full items-center justify-center p-3 sm:p-6 text-center">
        <div className="relative w-full max-w-2xl transform rounded-2xl bg-white text-left shadow-2xl transition-all border border-slate-200 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 px-4 sm:px-6 py-3.5 sm:py-4 bg-slate-50/60">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200 shadow-sm flex-shrink-0">
                <FolderPlus className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 truncate">Create New Project</h3>
                <p className="text-xs text-slate-500 truncate">
                  Launch a new strategic initiative with deadline and team
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsCreateProjectModalOpen(false)}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200/60 hover:text-slate-600 transition-colors cursor-pointer flex-shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-5 max-h-[calc(90vh-80px)] overflow-y-auto">
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs font-semibold">
                {error}
              </div>
            )}

            {/* Name & Key Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label
                  htmlFor="proj-name"
                  className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
                >
                  Project Name *
                </label>
                <input
                  id="proj-name"
                  type="text"
                  value={name}
                  onChange={e => handleNameChange(e.target.value)}
                  placeholder="e.g., Global Zero-Trust Auth Architecture"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-sm transition-all"
                  autoFocus
                />
              </div>

              <div>
                <label
                  htmlFor="proj-key"
                  className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
                >
                  Key / Code *
                </label>
                <input
                  id="proj-key"
                  type="text"
                  maxLength={5}
                  value={key}
                  onChange={e => {
                    setKey(e.target.value.toUpperCase());
                    setKeyManuallyEdited(true);
                  }}
                  placeholder="e.g. GZA"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-mono font-bold text-emerald-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-sm uppercase transition-all"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor="proj-desc"
                className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
              >
                Description & Business Objectives
              </label>
              <textarea
                id="proj-desc"
                rows={3}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Detail the target outcomes, architectural scope, and success milestones..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-sm transition-all resize-none"
              />
            </div>

            {/* Deadline & Initial Health */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5"
                >
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  Target Deadline *
                </label>
                <CustomDatePicker
                  value={deadline}
                  onChange={val => setDeadline(val)}
                  className="w-full"
                  buttonClassName="w-full py-2.5 px-3.5 text-xs sm:text-sm font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Initial Health Status
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: 'on_track', label: 'On Track', color: 'emerald' },
                    { id: 'at_risk', label: 'At Risk', color: 'amber' },
                    { id: 'behind', label: 'Behind', color: 'rose' }
                  ].map(h => (
                    <button
                      key={h.id}
                      type="button"
                      onClick={() => setHealth(h.id as ProjectHealth)}
                      className={`py-2 text-xs font-semibold rounded-xl border transition-all ${
                        health === h.id
                          ? 'border-slate-800 bg-slate-900 text-white shadow-sm'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {h.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Starting Progress Slider */}
            <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-2">
              <div className="flex justify-between items-baseline">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-emerald-600" />
                  Initial Progress Percentage
                </span>
                <span className="text-lg font-extrabold text-emerald-800 tabular-nums">
                  {initialProgress}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={initialProgress}
                onChange={e => setInitialProgress(Number(e.target.value))}
                className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
              />
              <p className="text-[11px] text-slate-400">
                Team members can manually adjust and advance this progress as work progresses.
              </p>
            </div>

            {/* Assigned Team Members Multi-Select */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-slate-500" />
                Assign Team Contributors ({selectedMemberIds.length} selected)
              </label>
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 mb-3 text-xs text-slate-600">
                <Shield className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>
                  <strong>Visibility Rule:</strong> This project will only be visible to assigned contributors. Unassigned team members cannot see this project.
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {users.map(u => {
                  const isSelected = selectedMemberIds.includes(u.id);
                  return (
                    <div
                      key={u.id}
                      onClick={() => toggleMember(u.id)}
                      className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                        isSelected
                          ? 'border-emerald-400 bg-emerald-50/50 ring-1 ring-emerald-400/40'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="relative">
                          <img
                            src={u.avatar}
                            alt={u.name}
                            className="w-7 h-7 rounded-full object-cover"
                          />
                          {u.role !== 'manager' && (
                            <span className="absolute -bottom-0.5 -right-0.5">
                              <PresenceBadge status={u.presence} variant="dot" size="sm" />
                            </span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate">{u.name}</p>
                          <p className="text-[10px] text-slate-500 truncate">{u.title}</p>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}} // handled by parent div
                        className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500/20"
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsCreateProjectModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm hover:shadow transition-all"
              >
                <Sparkles className="w-4 h-4" />
                Launch Project
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
