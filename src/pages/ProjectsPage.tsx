import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ProjectHealth } from '../types';
import { PresenceBadge } from '../components/common/PresenceBadge';
import { StatusBadge } from '../components/common/StatusBadge';
import {
  Calendar,
  Users,
  ArrowLeft,
  Sparkles,
  TrendingUp,
  Activity,
  Sliders,
  CheckCircle2,
  CheckSquare,
  Clock,
  Plus,
  FolderPlus,
  Search,
  PhoneCall,
  MapPin,
  Phone
} from 'lucide-react';

export const ProjectsPage: React.FC = () => {
  const {
    projects,
    users,
    tasks,
    currentUser,
    selectedProjectId,
    setSelectedProjectId,
    setSelectedTaskId,
    updateProjectProgress,
    updateProjectMembers,
    setIsCreateProjectModalOpen,
    setIsCreateModalOpen,
    updateTaskStatus,
    activities
  } = useApp();

  const isMarketing = !!(currentUser.department && currentUser.department.toLowerCase().includes('market'));

  const [searchQuery, setSearchQuery] = useState('');
  const [sliderValue, setSliderValue] = useState<number | null>(null);
  const [managerScope, setManagerScope] = useState<'all' | 'assigned'>('all');
  const [isManagingMembers, setIsManagingMembers] = useState(false);

  // Role-based visibility:
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

  const isUserProjectMember = (p: Project, u: { id: string; email?: string; name?: string }) => {
    if (!p.members || p.members.length === 0) return true;
    if (p.members.includes(u.id)) return true;
    if (u.id === 'user-marketing-emp' && p.members.some(m => m === 'user-marketing-emp' || m.includes('aarav'))) return true;
    if (u.id === 'user-marketing-mgr' && p.members.some(m => m === 'user-marketing-mgr' || m.includes('priya'))) return true;
    if (u.email && p.members.some(m => m.toLowerCase() === u.email?.toLowerCase())) return true;
    return false;
  };

  // Role-based visibility scoping:
  // - Employees ONLY see projects where they are assigned as members
  // - Managers see all projects, or can filter by projects assigned to them
  const visibleProjects = projects.filter(p => {
    if (currentUser.role === 'employee') {
      return isUserProjectMember(p, currentUser);
    }
    if (managerScope === 'assigned') {
      return isUserProjectMember(p, currentUser);
    }
    return true;
  });

  const selectedProject = visibleProjects.find(p => p.id === selectedProjectId);

  const filteredProjects = visibleProjects.filter(p => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        p.key.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const getHealthBadge = (health: ProjectHealth) => {
    switch (health) {
      case 'on_track':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            On Track
          </span>
        );
      case 'at_risk':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            At Risk
          </span>
        );
      case 'behind':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-200 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            Behind
          </span>
        );
    }
  };

  // Detailed Project View
  if (selectedProject) {
    const projectMembers = users.filter(u => selectedProject.members.includes(u.id));
    // Employees only see their own assigned tasks for the project; managers see all project tasks
    const projectTasks = tasks.filter(
      t => t.projectId === selectedProject.id && (currentUser.role === 'manager' || isTaskAssignedToUser(t, currentUser))
    );
    const completedProjectTasks = projectTasks.filter(t => t.status === 'completed');
    const projectActivities = activities.filter(
      a => a.type === 'project' && a.target.includes(selectedProject.name)
    );

    const currentDisplayProgress = sliderValue !== null ? sliderValue : selectedProject.progress;

    const handleSliderCommit = (val: number) => {
      setSliderValue(null);
      updateProjectProgress(selectedProject.id, val);
    };

    return (
      <div className="py-6 px-4 sm:px-8 max-w-7xl mx-auto space-y-6">
        {/* Back Button */}
        <button
          onClick={() => {
            setSelectedProjectId(null);
            setSliderValue(null);
          }}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-emerald-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to all projects
        </button>

        {/* Project Header Banner */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-soft">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                  {selectedProject.key}
                </span>
                {getHealthBadge(selectedProject.health)}
              </div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                {selectedProject.name}
              </h1>
              <p className="text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
                {selectedProject.description}
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 px-3 py-2 rounded-xl border border-slate-100">
              <Clock className="w-4 h-4 text-emerald-600" />
              <span>
                Last updated by{' '}
                <strong className="text-slate-800">
                  {selectedProject.lastUpdatedBy || 'Team member'}
                </strong>{' '}
                ({selectedProject.lastUpdatedAt || 'Recently'})
              </span>
            </div>
          </div>

          {/* KPI Strip */}
          <div className="pt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Current Progress KPI */}
            <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100">
              <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                Current Progress
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-extrabold text-emerald-900 tabular-nums">
                  {selectedProject.progress}%
                </span>
                <span className="text-xs font-semibold text-emerald-700">Manual Status</span>
              </div>
            </div>

            {/* Target Deadline */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Target Deadline
              </span>
              <p className="text-sm font-bold text-slate-800 mt-1 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-emerald-600" />
                {selectedProject.deadline}
              </p>
            </div>

            {/* Team Size */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Assigned Team
              </span>
              <p className="text-sm font-bold text-slate-800 mt-1 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-emerald-600" />
                {projectMembers.length} Members
              </p>
            </div>

            {/* Linked Tasks KPI */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Project Deliverables
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold text-slate-900 tabular-nums">
                  {completedProjectTasks.length}/{projectTasks.length}
                </span>
                <span className="text-xs font-semibold text-emerald-700">Tasks Done</span>
              </div>
            </div>
          </div>
        </div>

        {/* Manual Progress Station & Health Control */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-soft p-6 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-emerald-600" />
                <h2 className="text-base font-bold text-slate-900">
                  Manual Progress & Health Controls
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Each employee and manager can manually update completion percentage and health status.
              </p>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 font-medium">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Decoupled from independent tasks</span>
            </div>
          </div>

          {/* Interactive Range Slider */}
          <div className="space-y-3">
            <div className="flex justify-between items-baseline">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Adjust Progress Slider
              </span>
              <span className="text-2xl font-extrabold text-emerald-800 tabular-nums">
                {currentDisplayProgress}%
              </span>
            </div>

            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={currentDisplayProgress}
              onChange={e => setSliderValue(Number(e.target.value))}
              onMouseUp={e => handleSliderCommit(Number((e.target as HTMLInputElement).value))}
              onTouchEnd={e => handleSliderCommit(Number((e.target as HTMLInputElement).value))}
              className="w-full h-3 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-emerald-600 transition-all"
            />

            <div className="flex justify-between text-[10px] sm:text-[11px] font-semibold text-slate-400 px-1">
              <span><span className="hidden sm:inline">0% </span>Kickoff</span>
              <span>25%<span className="hidden sm:inline"> Planning</span></span>
              <span>50%<span className="hidden sm:inline"> In Flight</span></span>
              <span>75%<span className="hidden sm:inline"> Testing</span></span>
              <span>100%<span className="hidden sm:inline"> Done</span></span>
            </div>
          </div>

          {/* Quick Adjustment Stepper Buttons */}
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <span className="text-xs font-semibold text-slate-500 mr-1">Quick Nudge:</span>
            {[-10, -5, +5, +10].map(delta => (
              <button
                key={delta}
                onClick={() =>
                  updateProjectProgress(
                    selectedProject.id,
                    Math.min(100, Math.max(0, selectedProject.progress + delta))
                  )
                }
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition-all active:scale-95"
              >
                {delta > 0 ? `+${delta}%` : `${delta}%`}
              </button>
            ))}

            <div className="h-4 w-px bg-slate-200 mx-1 hidden sm:block" />

            <span className="text-xs font-semibold text-slate-500 mr-1 hidden sm:inline">Set Stage:</span>
            {[25, 50, 75, 100].map(target => (
              <button
                key={target}
                onClick={() => updateProjectProgress(selectedProject.id, target)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95 ${
                  selectedProject.progress === target
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                }`}
              >
                {target}% {target === 100 ? 'Live' : ''}
              </button>
            ))}
          </div>

          {/* Project Health Selector */}
          <div className="pt-4 border-t border-slate-100 space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Update Health Status
            </label>
            <div className="flex flex-wrap items-center gap-2">
              {(
                [
                  { id: 'on_track', label: 'On Track', desc: 'Progress advancing smoothly', color: 'bg-emerald-600' },
                  { id: 'at_risk', label: 'At Risk', desc: 'Blockers or upcoming deadline risk', color: 'bg-amber-600' },
                  { id: 'behind', label: 'Behind', desc: 'Critical delay needing intervention', color: 'bg-rose-600' }
                ] as const
              ).map(st => (
                <button
                  key={st.id}
                  onClick={() =>
                    updateProjectProgress(selectedProject.id, selectedProject.progress, st.id)
                  }
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-semibold transition-all ${
                    selectedProject.health === st.id
                      ? 'border-slate-800 bg-slate-900 text-white shadow-sm ring-1 ring-slate-800'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${st.color}`} />
                  <span>{st.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Two Columns: Project Deliverables & Team Members */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Project Deliverables & Tasks */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-soft p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 flex-wrap">
                {isMarketing ? <PhoneCall className="w-4 h-4 text-emerald-600" /> : <CheckSquare className="w-4 h-4 text-emerald-600" />}
                <h3 className="text-sm font-bold text-slate-900">
                  {isMarketing ? `Campaign Leads & Engagements (${projectTasks.length})` : `Project Tasks & Deliverables (${projectTasks.length})`}
                </h3>
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                  {completedProjectTasks.length} / {projectTasks.length} {isMarketing ? 'converted' : 'completed'}
                </span>
              </div>

              {currentUser.role === 'manager' && (
                <button
                  onClick={() => {
                    setSelectedProjectId(selectedProject.id);
                    setIsCreateModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all self-start sm:self-auto cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isMarketing ? 'Schedule Lead' : 'Assign Task'}</span>
                </button>
              )}
            </div>

            {/* List of Tasks linked to this project */}
            {projectTasks.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <div className="w-10 h-10 rounded-xl bg-white shadow-soft-sm text-slate-400 flex items-center justify-center mx-auto mb-2 border border-slate-100">
                  {isMarketing ? <PhoneCall className="w-5 h-5 text-slate-400" /> : <CheckSquare className="w-5 h-5 text-slate-400" />}
                </div>
                <p className="text-xs text-slate-600 font-semibold">
                  {isMarketing ? 'No client leads linked to this campaign yet.' : 'No deliverables linked to this project yet.'}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {isMarketing ? 'Client calls, field visits, and demos added to this campaign will be tracked here.' : 'Tasks added to this project will be tracked here in real-time.'}
                </p>
                {currentUser.role === 'manager' && (
                  <button
                    onClick={() => {
                      setSelectedProjectId(selectedProject.id);
                      setIsCreateModalOpen(true);
                    }}
                    className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold shadow-sm transition-all"
                  >
                    <Plus className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{isMarketing ? `Schedule First Lead for ${selectedProject.name}` : `Assign First Task to ${selectedProject.name}`}</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-2.5">
                {projectTasks.map(t => {
                  const assignee = users.find(u => u.id === t.assigneeId);
                  const isDone = t.status === 'completed';

                  return (
                    <div
                      key={t.id}
                      onClick={() => setSelectedTaskId(t.id)}
                      className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all cursor-pointer hover:shadow-soft-sm ${
                        isDone
                          ? 'bg-emerald-50/30 border-emerald-100/80 hover:border-emerald-200'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start sm:items-center gap-3 min-w-0">
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            updateTaskStatus(t.id, isDone ? (isMarketing ? 'calling' : 'todo') : 'completed');
                          }}
                          className="mt-0.5 sm:mt-0 flex-shrink-0 cursor-pointer"
                          title={isDone ? (isMarketing ? 'Reopen Lead' : 'Mark as To Do') : (isMarketing ? 'Mark Deal Closed / Won' : 'Mark as Completed')}
                        >
                          <CheckCircle2
                            className={`w-4 h-4 transition-colors ${
                              isDone ? 'text-emerald-600 fill-emerald-100' : 'text-slate-300 hover:text-emerald-500'
                            }`}
                          />
                        </button>

                        <div className="min-w-0">
                          <p
                            className={`text-xs font-semibold truncate ${
                              isDone ? 'text-slate-500 line-through' : 'text-slate-900'
                            }`}
                          >
                            {t.title}
                          </p>
                          <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500 flex-wrap">
                            {assignee && (
                              <span className="flex items-center gap-1 text-slate-600">
                                <img
                                  src={assignee.avatar}
                                  alt={assignee.name}
                                  className="w-3.5 h-3.5 rounded-full object-cover"
                                />
                                <span className="font-medium">{assignee.name}</span>
                              </span>
                            )}
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-slate-400" />
                              {isMarketing ? 'Meeting ' : 'Due '}{t.dueDate}
                            </span>
                            {t.clientContact && (
                              <>
                                <span>•</span>
                                <span className="text-slate-600 font-medium">{t.clientContact}</span>
                              </>
                            )}
                            {t.clientLocation && (
                              <>
                                <span>•</span>
                                <span className="flex items-center gap-0.5 text-slate-500">
                                  <MapPin className="w-3 h-3 text-slate-400" />
                                  {t.clientLocation}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto flex-shrink-0">
                        {/* Priority Badge */}
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded capitalize ${
                            t.priority === 'urgent'
                              ? 'bg-rose-100 text-rose-800'
                              : t.priority === 'high'
                              ? 'bg-amber-100 text-amber-800'
                              : t.priority === 'medium'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {t.priority}
                        </span>

                        {/* Status Badge */}
                        <StatusBadge status={t.status} size="sm" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Recent Progress Updates for this project */}
            {projectActivities.length > 0 && (
              <div className="pt-4 border-t border-slate-100">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-emerald-600" />
                  Recent Progress Updates
                </span>
                <div className="space-y-2">
                  {projectActivities.slice(0, 3).map(act => {
                    const actor = users.find(u => u.id === act.userId);
                    return (
                      <div key={act.id} className="text-xs text-slate-600 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span>
                          <strong className="text-slate-900">{actor?.name}</strong> {act.action}{' '}
                          <span className="text-slate-400">({act.timestamp})</span>
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Team Members Column */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-soft p-5">
            <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-600" />
                Project Contributors ({projectMembers.length})
              </h3>
              {currentUser.role === 'manager' && (
                <button
                  onClick={() => setIsManagingMembers(!isManagingMembers)}
                  className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 px-2.5 py-1 rounded-lg transition-colors border border-emerald-200"
                >
                  {isManagingMembers ? 'Done' : '+ Manage Team'}
                </button>
              )}
            </div>

            {isManagingMembers && currentUser.role === 'manager' ? (
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                <p className="text-[11px] text-slate-500 mb-2">
                  Assign or remove team members. Only checked contributors can view this project:
                </p>
                {users.map(u => {
                  const isAssigned = selectedProject.members.includes(u.id);
                  return (
                    <div
                      key={u.id}
                      onClick={() => {
                        const newMembers = isAssigned
                          ? selectedProject.members.filter(id => id !== u.id)
                          : [...selectedProject.members, u.id];
                        updateProjectMembers(selectedProject.id, newMembers);
                      }}
                      className={`flex items-center justify-between p-2 rounded-xl border cursor-pointer transition-all ${
                        isAssigned
                          ? 'border-emerald-300 bg-emerald-50/60 ring-1 ring-emerald-300/40'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <img
                          src={u.avatar}
                          alt={u.name}
                          className="w-7 h-7 rounded-full object-cover"
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate">
                            {u.name} {u.id === currentUser.id ? '(You)' : ''}
                          </p>
                          <p className="text-[10px] text-slate-500 truncate">{u.title}</p>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={isAssigned}
                        onChange={() => {}}
                        className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500/20"
                      />
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-3">
                {projectMembers.map(member => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="relative">
                        <img
                          src={member.avatar}
                          alt={member.name}
                          className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-200"
                        />
                        {member.role !== 'manager' && (
                          <span className="absolute -bottom-0.5 -right-0.5">
                            <PresenceBadge status={member.presence} variant="dot" size="sm" />
                          </span>
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">{member.name}</p>
                        <p className="text-[11px] text-slate-500">{member.title}</p>
                      </div>
                    </div>
                    {member.role !== 'manager' && (
                      <PresenceBadge status={member.presence} variant="pill" size="sm" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Project Overview Grid
  return (
    <div className="py-6 px-4 sm:px-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {currentUser.role === 'employee' ? 'My Assigned Projects' : 'Projects'}
            </h1>
            {currentUser.role === 'employee' && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                {visibleProjects.length} Assigned
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {currentUser.role === 'employee'
              ? 'Only initiatives and deliverables you are actively assigned to contribute to.'
              : 'Track strategic initiatives, manage assigned teams, and monitor deliverable execution.'}
          </p>
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 w-full sm:w-auto">
          {currentUser.role === 'manager' && (
            <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200 text-xs font-semibold w-full sm:w-auto justify-center">
              <button
                onClick={() => setManagerScope('all')}
                className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg transition-all text-center cursor-pointer ${
                  managerScope === 'all'
                    ? 'bg-white text-slate-900 shadow-sm font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All ({projects.length})
              </button>
              <button
                onClick={() => setManagerScope('assigned')}
                className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg transition-all text-center cursor-pointer ${
                  managerScope === 'assigned'
                    ? 'bg-white text-slate-900 shadow-sm font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Assigned to Me ({projects.filter(p => p.members.includes(currentUser.id)).length})
              </button>
            </div>
          )}

          <div className="relative flex-1 sm:flex-none min-w-[140px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search projects..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all sm:w-52 shadow-soft-sm"
            />
          </div>

          {currentUser.role === 'manager' && (
            <button
              onClick={() => setIsCreateProjectModalOpen(true)}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm hover:shadow transition-all flex-shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New Project</span>
            </button>
          )}
        </div>
      </div>

      {filteredProjects.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-md mx-auto shadow-soft">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <FolderPlus className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">
            {currentUser.role === 'employee' ? 'No Assigned Projects' : 'No projects found'}
          </h3>
          <p className="text-xs text-slate-500 mt-1 mb-4 leading-relaxed">
            {searchQuery
              ? `No active project initiatives match "${searchQuery}".`
              : currentUser.role === 'employee'
              ? 'You are not assigned to any project initiatives yet. Projects will automatically appear here as soon as a manager assigns you as a team contributor or assigns a project task to you.'
              : 'No project initiatives have been registered yet.'}
          </p>
          <div className="flex items-center justify-center gap-2">
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
              >
                Clear Search
              </button>
            )}
            {currentUser.role === 'manager' && (
              <button
                onClick={() => setIsCreateProjectModalOpen(true)}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-sm"
              >
                + New Project
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Projects Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        {filteredProjects.map(project => {
          const projectMembers = users.filter(u => project.members.includes(u.id));
          const projectTasks = tasks.filter(t => t.projectId === project.id);
          const completedTasksCount = projectTasks.filter(t => t.status === 'completed').length;

          return (
            <div
              key={project.id}
              onClick={() => setSelectedProjectId(project.id)}
              className="bg-white rounded-2xl p-6 border border-slate-200 shadow-soft hover:shadow-soft-md hover:border-emerald-400 transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                      {project.key}
                    </span>
                  </div>
                  {getHealthBadge(project.health)}
                </div>

                <h2 className="text-lg font-bold text-slate-900 group-hover:text-emerald-800 transition-colors mb-2">
                  {project.name}
                </h2>
                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-4">
                  {project.description}
                </p>

                {/* Live Task Deliverables Pill */}
                <div className="flex items-center justify-between text-xs mb-5 px-3 py-2 rounded-xl bg-slate-50 border border-slate-100 group-hover:border-emerald-200 group-hover:bg-emerald-50/30 transition-colors">
                  <div className="flex items-center gap-1.5 text-slate-700 font-semibold">
                    <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{projectTasks.length} {projectTasks.length === 1 ? 'Task' : 'Tasks'}</span>
                  </div>
                  <span className="text-[11px] font-medium text-slate-500">
                    {projectTasks.length === 0
                      ? 'No tasks assigned'
                      : `${completedTasksCount}/${projectTasks.length} done (${Math.round((completedTasksCount / projectTasks.length) * 100)}%)`}
                  </span>
                </div>
              </div>

              <div>
                {/* Manual Progress Bar with Quick Nudge Steppers */}
                <div className="space-y-2 mb-4" onClick={e => e.stopPropagation()}>
                  <div className="flex justify-between items-baseline text-xs">
                    <span className="font-semibold text-slate-600">Manual Progress</span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-extrabold text-emerald-800 tabular-nums text-sm">
                        {project.progress}%
                      </span>
                      <span className="text-[10px] text-slate-400">
                        • {project.lastUpdatedBy ? `by ${project.lastUpdatedBy.split(' ')[0]}` : 'Team'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        updateProjectProgress(
                          project.id,
                          Math.max(0, project.progress - 5)
                        )
                      }
                      disabled={project.progress <= 0}
                      className="w-6 h-6 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center transition-colors disabled:opacity-40"
                      title="Decrease progress by 5%"
                    >
                      -5
                    </button>

                    <div className="flex-1 bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-600 h-full rounded-full transition-all duration-300"
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>

                    <button
                      onClick={() =>
                        updateProjectProgress(
                          project.id,
                          Math.min(100, project.progress + 5)
                        )
                      }
                      disabled={project.progress >= 100}
                      className="w-6 h-6 rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center transition-colors disabled:opacity-40"
                      title="Increase progress by 5%"
                    >
                      +5
                    </button>
                  </div>
                </div>

                {/* Footer: Team Avatars & Deadline */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-100 text-xs">
                  {/* Avatars */}
                  <div className="flex items-center -space-x-2">
                    {projectMembers.map(member => (
                      <div
                        key={member.id}
                        className="relative"
                        title={member.role !== 'manager' ? `${member.name} (${member.presence})` : member.name}
                      >
                        <img
                          src={member.avatar}
                          alt={member.name}
                          className="w-7 h-7 rounded-full object-cover ring-2 ring-white"
                        />
                      </div>
                    ))}
                  </div>

                  <span className="text-slate-500 font-medium flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    Due {project.deadline}
                  </span>
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
