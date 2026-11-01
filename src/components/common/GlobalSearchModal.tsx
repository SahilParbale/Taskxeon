import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Search, Folder, CheckSquare, Users, ArrowRight, X } from 'lucide-react';

export const GlobalSearchModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose
}) => {
  const { tasks, projects, users, currentUser, setSelectedTaskId, setSelectedProjectId, setCurrentView } = useApp();
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const trimmed = query.trim().toLowerCase();

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

  const visibleTasks = currentUser.role === 'employee'
    ? tasks.filter(t => isTaskAssignedToUser(t, currentUser))
    : tasks;

  const matchedTasks = trimmed
    ? visibleTasks.filter(t => t.title.toLowerCase().includes(trimmed) || t.description.toLowerCase().includes(trimmed))
    : visibleTasks.slice(0, 4);

  const matchedProjects = trimmed
    ? projects.filter(p => p.name.toLowerCase().includes(trimmed) || p.key.toLowerCase().includes(trimmed))
    : projects.slice(0, 3);

  const matchedUsers = trimmed
    ? users.filter(u => u.name.toLowerCase().includes(trimmed) || u.title.toLowerCase().includes(trimmed))
    : users.slice(0, 3);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity" onClick={onClose} />

      <div className="flex min-h-full items-start justify-center p-3 sm:p-6 pt-10 sm:pt-24 text-center">
        <div className="relative w-full max-w-xl transform rounded-2xl bg-white text-left shadow-2xl transition-all border border-slate-200 overflow-hidden">
          {/* Input Header */}
          <div className="relative border-b border-slate-100 flex items-center px-3.5 sm:px-4 py-3 sm:py-3.5">
            <Search className="w-5 h-5 text-slate-400 mr-2.5 sm:mr-3 flex-shrink-0" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search tasks, projects, teammates..."
              className="w-full bg-transparent text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none"
              autoFocus
            />
            {query && (
              <button onClick={() => setQuery('')} className="p-1 text-slate-400 hover:text-slate-600 flex-shrink-0">
                <X className="w-4 h-4" />
              </button>
            )}
            <kbd className="hidden sm:inline-block ml-2 px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-slate-100 rounded border border-slate-200 flex-shrink-0">
              ESC
            </kbd>
          </div>

          {/* Results Area */}
          <div className="max-h-[65vh] sm:max-h-96 overflow-y-auto p-3 sm:p-4 space-y-4 divide-y divide-slate-100">
            {/* Tasks section */}
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 block mb-2">
                Tasks
              </span>
              {matchedTasks.length === 0 ? (
                <p className="text-xs text-slate-400 px-2 py-1">No tasks matching search</p>
              ) : (
                <div className="space-y-1">
                  {matchedTasks.map(t => (
                    <div
                      key={t.id}
                      onClick={() => {
                        setSelectedTaskId(t.id);
                        onClose();
                      }}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-emerald-50/60 cursor-pointer group transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <CheckSquare className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                        <span className="text-xs font-medium text-slate-800 truncate group-hover:text-emerald-900">
                          {t.title}
                        </span>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Projects section */}
            <div className="pt-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 block mb-2">
                Projects
              </span>
              <div className="space-y-1">
                {matchedProjects.map(p => (
                  <div
                    key={p.id}
                    onClick={() => {
                      setSelectedProjectId(p.id);
                      setCurrentView('projects');
                      onClose();
                    }}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-100 cursor-pointer group transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <Folder className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <div>
                        <span className="text-xs font-semibold text-slate-800">
                          [{p.key}] {p.name}
                        </span>
                        <span className="text-[11px] text-slate-400 ml-2">
                          {(currentUser.department && currentUser.department.toLowerCase().includes('market')) ||
                          (p.department && p.department.toLowerCase().includes('market')) ||
                          p.id.includes('mkt')
                            ? 'Sales Pipeline'
                            : `${p.progress}% • ${p.health.replace('_', ' ').toUpperCase()}`}
                        </span>
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                ))}
              </div>
            </div>

            {/* Users section */}
            <div className="pt-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 block mb-2">
                Team Members
              </span>
              <div className="space-y-1">
                {matchedUsers.map(u => (
                  <div
                    key={u.id}
                    onClick={() => {
                      setCurrentView('team');
                      onClose();
                    }}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-100 cursor-pointer group transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <img src={u.avatar} alt={u.name} className="w-6 h-6 rounded-full object-cover" />
                      <div>
                        <span className="text-xs font-semibold text-slate-800">{u.name}</span>
                        <span className="text-[11px] text-slate-400 ml-2">{u.title}</span>
                      </div>
                    </div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">{u.role}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
