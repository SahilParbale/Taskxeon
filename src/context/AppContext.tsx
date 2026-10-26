import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import confetti from 'canvas-confetti';
import { dispatchSystemNotification } from '../lib/notifications';
import {
  User,
  Project,
  Task,
  Notification,
  ActivityLog,
  ChatMessage,
  DevPipeline,
  DevLog,
  Role,
  PresenceStatus,
  TaskStatus,
  TaskPriority,
  ProjectHealth,
  ViewType
} from '../types';
import {
  INITIAL_USERS,
  INITIAL_PROJECTS,
  INITIAL_TASKS,
  INITIAL_NOTIFICATIONS,
  INITIAL_ACTIVITIES,
  INITIAL_DEV_PIPELINES,
  INITIAL_DEV_LOGS,
  INITIAL_MESSAGES
} from '../data/mockData';
import {
  checkSupabaseHealth,
  SupabaseStatus,
  fetchProjectsFromSupabase,
  upsertProjectToSupabase,
  deleteProjectFromSupabase,
  fetchTasksFromSupabase,
  upsertTaskToSupabase,
  deleteTaskFromSupabase,
  fetchUsersFromSupabase,
  upsertUserToSupabase,
  deleteUserFromSupabase,
  fetchActivitiesFromSupabase,
  insertActivityToSupabase,
  fetchNotificationsFromSupabase,
  upsertNotificationToSupabase,
  clearAllCloudDataFromSupabase
} from '../lib/supabase';

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  type: 'success' | 'info' | 'warning' | 'error';
}

interface AppContextType {
  currentUser: User;
  users: User[];
  tasks: Task[];
  projects: Project[];
  notifications: Notification[];
  activities: ActivityLog[];
  devPipelines: DevPipeline[];
  devLogs: DevLog[];
  messages: ChatMessage[];
  currentView: ViewType;
  selectedProjectId: string | null;
  selectedTaskId: string | null;
  searchQuery: string;
  isCreateModalOpen: boolean;
  isCreateProjectModalOpen: boolean;
  isCreateEmployeeModalOpen: boolean;
  isRoleSwitcherOpen: boolean;
  isSearchOpen: boolean;
  toasts: ToastMessage[];

  // Actions
  setCurrentView: (view: ViewType) => void;
  setSelectedProjectId: (id: string | null) => void;
  setSelectedTaskId: (id: string | null) => void;
  setSearchQuery: (query: string) => void;
  setIsCreateModalOpen: (open: boolean) => void;
  setIsCreateProjectModalOpen: (open: boolean) => void;
  setIsCreateEmployeeModalOpen: (open: boolean) => void;
  setIsSearchOpen: (open: boolean) => void;
  createEmployee: (data: {
    name: string;
    email: string;
    title: string;
    department?: string;
    username?: string;
    password?: string;
    avatar?: string;
    bio?: string;
    presence?: PresenceStatus;
    phone?: string;
  }) => void;
  deleteEmployee: (userId: string) => void;
  setIsRoleSwitcherOpen: (open: boolean) => void;
  switchRole: (role: Role) => void;
  switchUser: (userId: string) => void;
  setUserPresence: (presence: PresenceStatus) => void;
  setMemberPresence: (userId: string, presence: PresenceStatus) => void;
  updateProjectProgress: (projectId: string, progress: number, health?: ProjectHealth) => void;
  updateProjectMembers: (projectId: string, memberIds: string[]) => void;
  createProject: (data: {
    name: string;
    key: string;
    description: string;
    health?: ProjectHealth;
    deadline: string;
    members: string[];
    initialProgress?: number;
  }) => void;
  createTask: (data: {
    title: string;
    description: string;
    projectId?: string;
    assigneeId: string;
    priority: TaskPriority;
    dueDate: string;
    tags?: string[];
  }) => void;
  updateTaskStatus: (taskId: string, status: TaskStatus) => void;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  deleteTask: (taskId: string) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  sendNotification: (title: string, message: string, tone?: 'chime' | 'ring' | 'success' | 'message') => void;
  sendMessage: (text: string, channelId?: string, recipientId?: string) => void;
  resetAllData: () => void;
  addToast: (title: string, description?: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
  removeToast: (id: string) => void;
  syncWithSupabase: () => Promise<void>;

  // Authentication
  isAuthenticated: boolean;
  login: (usernameOrEmail: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;

  // Supabase Status
  supabaseStatus: SupabaseStatus;
  supabaseLatencyMs: number;

  // Computed
  unreadCount: number;
  userNotifications: Notification[];
  assignedTasks: Task[];
}

const STORAGE_KEY = 'taskflow_clean_v3';

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Purge any legacy demo cache from earlier development versions and clear state
  useEffect(() => {
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (
          key &&
          (key.startsWith('taskflow_data_v1') ||
           key.startsWith('taskflow_prod_v2') ||
           key.startsWith('taskflow_dev'))
        ) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(k => localStorage.removeItem(k));
    } catch (e) {
      console.warn('Could not clean legacy cache', e);
    }

    if (!localStorage.getItem('taskflow_clean_v3_executed')) {
      // Force empty production state into memory and Supabase Cloud
      setProjects([]);
      setTasks([]);
      setNotifications([]);
      setActivities([]);
      setMessages([]);
      localStorage.setItem('taskflow_clean_v3_executed', 'true');
      clearAllCloudDataFromSupabase().catch(() => {});
    }
  }, []);

  // Load persisted state or defaults
  const [isInitialized, setIsInitialized] = useState(false);
  const [users, setUsers] = useState<User[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_users`);
      if (saved) {
        const parsed: User[] = JSON.parse(saved);
        return parsed.map(u => {
          let user = (u.role as string) === 'developer' ? { ...u, role: 'employee' as Role } : u;
          if (
            user.id === 'user-1' ||
            user.name === 'Sarah Jenkins' ||
            user.email?.includes('sarah.jenkins')
          ) {
            return {
              ...user,
              id: 'user-1',
              name: 'Shreyas Jadhav',
              email: 'shreyasjadhav@gmail.com',
              username: 'shreyasjadhav',
              password: 'shreyas123',
              avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
              role: 'manager'
            };
          }
          return user;
        });
      }
      return INITIAL_USERS;
    } catch {
      return INITIAL_USERS;
    }
  });

  const [currentUserId, setCurrentUserId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_currentUserId`);
      return saved || 'user-1'; // Default Shreyas Jadhav (Manager)
    } catch {
      return 'user-1';
    }
  });

  const [projects, setProjects] = useState<Project[]>(() => {
    if (!localStorage.getItem('taskflow_clean_v3_executed')) return [];
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_projects`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [tasks, setTasks] = useState<Task[]>(() => {
    if (!localStorage.getItem('taskflow_clean_v3_executed')) return [];
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_tasks`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [notifications, setNotifications] = useState<Notification[]>(() => {
    if (!localStorage.getItem('taskflow_clean_v3_executed')) return [];
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_notifications`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [activities, setActivities] = useState<ActivityLog[]>(() => {
    if (!localStorage.getItem('taskflow_clean_v3_executed')) return [];
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_activities`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [devPipelines] = useState<DevPipeline[]>(INITIAL_DEV_PIPELINES);
  const [devLogs] = useState<DevLog[]>(INITIAL_DEV_LOGS);

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    if (!localStorage.getItem('taskflow_clean_v3_executed')) return [];
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_messages`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // UI state
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreateProjectModalOpen, setIsCreateProjectModalOpen] = useState(false);
  const [isCreateEmployeeModalOpen, setIsCreateEmployeeModalOpen] = useState(false);
  const [isRoleSwitcherOpen, setIsRoleSwitcherOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Global ⌘K / Ctrl+K keyboard shortcut listener for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Authentication state - checks local storage, defaults to false to present professional login
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_is_authenticated`);
      return saved === 'true';
    } catch {
      return false;
    }
  });

  // Current active user object
  const currentUser = useMemo(() => {
    return users.find(u => u.id === currentUserId) || users[0];
  }, [users, currentUserId]);

  // Persist to local storage
  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY}_users`, JSON.stringify(users));
      localStorage.setItem(`${STORAGE_KEY}_currentUserId`, currentUserId);
      localStorage.setItem(`${STORAGE_KEY}_is_authenticated`, String(isAuthenticated));
      localStorage.setItem(`${STORAGE_KEY}_projects`, JSON.stringify(projects));
      localStorage.setItem(`${STORAGE_KEY}_tasks`, JSON.stringify(tasks));
      localStorage.setItem(`${STORAGE_KEY}_notifications`, JSON.stringify(notifications));
      localStorage.setItem(`${STORAGE_KEY}_activities`, JSON.stringify(activities));
      localStorage.setItem(`${STORAGE_KEY}_messages`, JSON.stringify(messages));
    } catch (e) {
      console.warn('Could not persist state to localStorage', e);
    }
  }, [users, currentUserId, isAuthenticated, projects, tasks, notifications, activities, messages]);

  // Supabase Cloud State
  const [supabaseStatus, setSupabaseStatus] = useState<SupabaseStatus>('connecting');
  const [supabaseLatencyMs, setSupabaseLatencyMs] = useState(0);

  // Sync / Load with Supabase on startup
  const syncWithSupabase = async () => {
    setSupabaseStatus('connecting');
    const health = await checkSupabaseHealth();
    setSupabaseStatus(health.status);
    setSupabaseLatencyMs(health.latencyMs);

    if (health.status === 'connected') {
      try {
        const [cloudUsers, cloudProjects, cloudTasks, cloudActivities, cloudNotifs] = await Promise.all([
          fetchUsersFromSupabase(),
          fetchProjectsFromSupabase(),
          fetchTasksFromSupabase(),
          fetchActivitiesFromSupabase(),
          fetchNotificationsFromSupabase()
        ]);

        if (cloudUsers && cloudUsers.length > 0) {
          const mappedCloudUsers = cloudUsers.map(u => {
            if (u.id === 'user-1' || u.name === 'Sarah Jenkins' || u.email?.includes('sarah.jenkins')) {
              const updated = {
                ...u,
                id: 'user-1',
                name: 'Shreyas Jadhav',
                email: 'shreyasjadhav@gmail.com',
                username: 'shreyasjadhav',
                password: 'shreyas123',
                avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
                role: 'manager' as Role
              };
              upsertUserToSupabase(updated);
              return updated;
            }
            return u;
          });
          setUsers(mappedCloudUsers);
        } else {
          INITIAL_USERS.forEach(u => upsertUserToSupabase(u));
        }

        // Check if cloud data contains demo artifacts (e.g. 'proj-' or 'task-10')
        const hasLegacyDemoProjects = cloudProjects?.some(p => p.id.startsWith('proj-') || p.key === 'PHX');
        const hasLegacyDemoTasks = cloudTasks?.some(t => t.id.startsWith('task-10'));
        if (hasLegacyDemoProjects || hasLegacyDemoTasks) {
          console.info('[Supabase] Purging legacy demo data from cloud database...');
          await clearAllCloudDataFromSupabase();
          setProjects([]);
          setTasks([]);
          setActivities([]);
          setNotifications([]);
        } else {
          if (cloudProjects) setProjects(cloudProjects);
          if (cloudTasks) setTasks(cloudTasks);
          if (cloudActivities) setActivities(cloudActivities);
          if (cloudNotifs) setNotifications(cloudNotifs);
        }

        addToast('Supabase Connected 🟢', `Cloud DB in sync (${health.latencyMs}ms)`, 'success');
      } catch (err) {
        console.warn('Error loading from Supabase:', err);
      }
    } else if (health.status === 'needs_migration') {
      console.info('[Supabase] Connected to project, but tables need to be created using supabase/schema.sql');
    }
  };

  useEffect(() => {
    syncWithSupabase();
  }, []);

  // Manual project progress update by any employee or manager
  const updateProjectProgress = (projectId: string, newProgress: number, newHealth?: ProjectHealth) => {
    const clamped = Math.min(100, Math.max(0, Math.round(newProgress)));
    const targetProj = projects.find(p => p.id === projectId);
    if (!targetProj) return;

    setProjects(prev =>
      prev.map(p =>
        p.id === projectId
          ? {
              ...p,
              progress: clamped,
              health: newHealth || p.health,
              lastUpdatedBy: currentUser.name,
              lastUpdatedAt: 'Just now'
            }
          : p
      )
    );

    // Sync to Supabase in background
    upsertProjectToSupabase({
      ...targetProj,
      progress: clamped,
      health: newHealth || targetProj.health,
      lastUpdatedBy: currentUser.name,
      lastUpdatedAt: 'Just now'
    });

    // Record activity
    const newAct: ActivityLog = {
      id: `act-${Date.now()}`,
      userId: currentUser.id,
      action: `updated project progress to ${clamped}% for`,
      target: targetProj.name,
      timestamp: 'Just now',
      type: 'project'
    };
    setActivities(prev => [newAct, ...prev]);
    insertActivityToSupabase(newAct);

    addToast('Progress Updated', `${targetProj.name} set to ${clamped}%`, 'success');
  };

  // Create Project (Managers only)
  const createProject = (data: {
    name: string;
    key: string;
    description: string;
    health?: ProjectHealth;
    deadline: string;
    members: string[];
    initialProgress?: number;
  }) => {
    if (currentUser.role !== 'manager') {
      addToast('Permission Denied', 'Only Managers are authorized to create new project initiatives.', 'warning');
      return;
    }

    const newProjectId = `proj-${Date.now()}`;
    const newProject: Project = {
      id: newProjectId,
      name: data.name.trim(),
      key: data.key.trim().toUpperCase(),
      description: data.description.trim(),
      health: data.health || 'on_track',
      deadline: data.deadline,
      members: data.members.length > 0 ? data.members : [currentUser.id],
      progress: data.initialProgress !== undefined ? data.initialProgress : 0,
      lastUpdatedBy: currentUser.name,
      lastUpdatedAt: 'Just now'
    };

    setProjects(prev => [newProject, ...prev]);
    upsertProjectToSupabase(newProject);

    // Record activity
    const newAct: ActivityLog = {
      id: `act-${Date.now()}`,
      userId: currentUser.id,
      action: 'created new project initiative',
      target: data.name.trim(),
      timestamp: 'Just now',
      type: 'project'
    };
    setActivities(prev => [newAct, ...prev]);
    insertActivityToSupabase(newAct);

    addToast('Project Created 🎉', `"${data.name}" [${data.key.toUpperCase()}] is now active`, 'success');
  };

  // Update Project Members (Managers only)
  const updateProjectMembers = (projectId: string, memberIds: string[]) => {
    if (currentUser.role !== 'manager') {
      addToast('Permission Denied', 'Only Managers are authorized to manage project contributors.', 'warning');
      return;
    }
    const targetProj = projects.find(p => p.id === projectId);
    if (!targetProj) return;

    const safeMembers = memberIds.length > 0 ? memberIds : [currentUser.id];
    const updatedProj: Project = {
      ...targetProj,
      members: safeMembers,
      lastUpdatedBy: currentUser.name,
      lastUpdatedAt: 'Just now'
    };

    setProjects(prev =>
      prev.map(p => (p.id === projectId ? updatedProj : p))
    );
    upsertProjectToSupabase(updatedProj);

    // Record activity
    const newAct: ActivityLog = {
      id: `act-${Date.now()}`,
      userId: currentUser.id,
      action: 'updated assigned team contributors for',
      target: targetProj.name,
      timestamp: 'Just now',
      type: 'project'
    };
    setActivities(prev => [newAct, ...prev]);
    insertActivityToSupabase(newAct);

    addToast('Contributors Updated', `Team assigned to "${targetProj.name}" has been updated.`, 'success');
  };

  // Create Employee (Managers only)
  const createEmployee = (data: {
    name: string;
    email: string;
    title: string;
    department?: string;
    username?: string;
    password?: string;
    avatar?: string;
    bio?: string;
    presence?: PresenceStatus;
    phone?: string;
  }) => {
    if (currentUser.role !== 'manager') {
      addToast('Permission Denied', 'Only Managers are authorized to add new team members.', 'warning');
      return;
    }

    const newUserId = `user-${Date.now()}`;
    const defaultAvatars = [
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80'
    ];
    const chosenAvatar = data.avatar?.trim() || defaultAvatars[Math.floor(Math.random() * defaultAvatars.length)];

    const fallbackUsername = data.email.split('@')[0].toLowerCase().replace(/[^a-z0-9._-]/g, '');
    const username = data.username?.trim().toLowerCase() || fallbackUsername;
    const password = data.password?.trim() || 'password123';
    const dept = data.department?.trim() || 'Engineering';

    const newUser: User = {
      id: newUserId,
      name: data.name.trim(),
      email: data.email.trim().toLowerCase(),
      username: username,
      password: password,
      role: 'employee',
      avatar: chosenAvatar,
      title: data.title.trim(),
      department: dept,
      presence: data.presence || 'online',
      bio: data.bio?.trim() || `Team member contributing to TaskFlow initiatives.`,
      phone: data.phone?.trim()
    };

    setUsers(prev => [...prev, newUser]);
    upsertUserToSupabase(newUser);

    // Record activity
    const newAct: ActivityLog = {
      id: `act-${Date.now()}`,
      userId: currentUser.id,
      action: 'onboarded new team member',
      target: newUser.name,
      timestamp: 'Just now',
      type: 'presence'
    };
    setActivities(prev => [newAct, ...prev]);
    insertActivityToSupabase(newAct);

    // Auto-add new employee to the unified team chat with an announcement
    const welcomeMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderAvatar: currentUser.avatar,
      senderRole: currentUser.role,
      senderTitle: currentUser.title,
      channelId: 'ch-team-chat',
      text: `🎉 Welcome ${newUser.name} to the team as ${newUser.title}!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, welcomeMsg]);

    addToast('Employee Onboarded 🎉', `${newUser.name} added to the team & Team Chat!`, 'success');
  };

  // Delete Employee (Managers only)
  const deleteEmployee = (userId: string) => {
    if (currentUser.role !== 'manager') {
      addToast('Permission Denied', 'Only Managers are authorized to remove team members.', 'warning');
      return;
    }
    const targetUser = users.find(u => u.id === userId);
    if (!targetUser) return;
    if (targetUser.role === 'manager') {
      addToast('Cannot Remove Manager', 'Manager accounts cannot be deleted.', 'warning');
      return;
    }

    setUsers(prev => prev.filter(u => u.id !== userId));
    deleteUserFromSupabase(userId);
    addToast('Member Removed', `${targetUser.name} has been removed from the team roster.`, 'info');
  };

  // Toast Helpers
  const addToast = (title: string, description?: string, type: 'success' | 'info' | 'warning' | 'error' = 'info') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    setToasts(prev => [...prev, { id, title, description, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Switch demo persona by role
  const switchRole = (role: Role) => {
    let targetUser = users.find(u => u.role === role);
    if (!targetUser) {
      // Fallback match by id
      if (role === 'manager') targetUser = users.find(u => u.id === 'user-1');
      if (role === 'employee') targetUser = users.find(u => u.id === 'user-2');
    }
    if (targetUser) {
      setCurrentUserId(targetUser.id);
      addToast('Role Switched', `Now viewing TaskFlow as ${targetUser.name} (${targetUser.role.toUpperCase()})`, 'info');
    }
  };

  const switchUser = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      setCurrentUserId(user.id);
      addToast('User Switched', `Logged in as ${user.name}`, 'info');
    }
  };

  // Set member presence (Online, On Break, Offline) with live timing tracking
  const setMemberPresence = (userId: string, presence: PresenceStatus) => {
    const targetUser = users.find(u => u.id === userId);
    if (!targetUser) return;

    const updatedUser = { ...targetUser, presence };
    setUsers(prev => prev.map(u => (u.id === userId ? updatedUser : u)));
    upsertUserToSupabase(updatedUser);

    // Add activity
    const presenceLabels: Record<PresenceStatus, string> = {
      online: 'active online',
      break: 'on break',
      offline: 'offline'
    };
    const newAct: ActivityLog = {
      id: `act-${Date.now()}`,
      userId: targetUser.id,
      action: `status changed to ${presenceLabels[presence]}`,
      target: targetUser.name,
      timestamp: 'Just now',
      type: 'presence'
    };
    setActivities(prev => [newAct, ...prev]);
    insertActivityToSupabase(newAct);

    addToast(
      `${targetUser.name} • ${presence.toUpperCase()}`,
      `Status updated to ${presenceLabels[presence]}. Shift timer is now accumulating live data into ${presenceLabels[presence]}.`,
      'success'
    );
  };

  // Set current user presence
  const setUserPresence = (presence: PresenceStatus) => {
    setMemberPresence(currentUser.id, presence);
  };

  // Create Task
  const createTask = (data: {
    title: string;
    description: string;
    projectId?: string;
    assigneeId: string;
    priority: TaskPriority;
    dueDate: string;
    tags?: string[];
  }) => {
    if (currentUser.role !== 'manager') {
      addToast('Permission Denied', 'Employees are not authorized to create or assign tasks. Switch to Manager role to assign work.', 'warning');
      return;
    }

    const newTaskId = `task-${Date.now()}`;
    const newTask: Task = {
      id: newTaskId,
      title: data.title,
      description: data.description,
      projectId: data.projectId,
      assigneeId: data.assigneeId,
      createdById: currentUser.id,
      priority: data.priority,
      status: 'todo',
      dueDate: data.dueDate,
      createdAt: new Date().toISOString(),
      tags: data.tags || []
    };

    setTasks(prev => [newTask, ...prev]);
    upsertTaskToSupabase(newTask);

    // If assigned to a project, reflect changes to the respective project immediately
    const targetProj = data.projectId ? projects.find(p => p.id === data.projectId) : undefined;
    if (data.projectId) {
      setProjects(prev =>
        prev.map(p => {
          if (p.id === data.projectId) {
            const hasMember = p.members.includes(data.assigneeId);
            const updatedP = {
              ...p,
              members: hasMember ? p.members : [...p.members, data.assigneeId],
              lastUpdatedBy: currentUser.name,
              lastUpdatedAt: 'Just now'
            };
            upsertProjectToSupabase(updatedP);
            return updatedP;
          }
          return p;
        })
      );

      // Record project-level activity
      if (targetProj) {
        const newProjAct: ActivityLog = {
          id: `act-${Date.now()}-proj`,
          userId: currentUser.id,
          action: `added task "${data.title}" to`,
          target: targetProj.name,
          timestamp: 'Just now',
          type: 'project'
        };
        setActivities(prev => [newProjAct, ...prev]);
      }
    }

    // Dispatch notification to assignee if not creating for oneself
    const assignee = users.find(u => u.id === data.assigneeId);
    if (assignee && assignee.id !== currentUser.id) {
      const newNotif: Notification = {
        id: `notif-${Date.now()}`,
        userId: assignee.id,
        senderId: currentUser.id,
        title: 'New Task Assigned',
        message: `${currentUser.name} assigned you: "${data.title}"${targetProj ? ` in ${targetProj.name}` : ''}`,
        type: 'assignment',
        read: false,
        createdAt: new Date().toISOString(),
        taskId: newTaskId,
        projectId: data.projectId
      };
      setNotifications(prev => [newNotif, ...prev]);
      dispatchSystemNotification('New Task Assigned 📋', {
        body: `${currentUser.name} assigned you: "${data.title}"`,
        data: { taskId: newTaskId }
      });
    } else {
      // Self assignment or local trigger
      dispatchSystemNotification('Task Created 📋', {
        body: `"${data.title}" created successfully`,
        data: { taskId: newTaskId }
      });
    }

    // Add activity
    const newAct: ActivityLog = {
      id: `act-${Date.now()}`,
      userId: currentUser.id,
      action: `assigned task to ${assignee?.name || 'team'}${targetProj ? ` in ${targetProj.name}` : ''}`,
      target: data.title,
      timestamp: 'Just now',
      type: 'task'
    };
    setActivities(prev => [newAct, ...prev]);

    addToast(
      'Task Created 🎉',
      `"${data.title}" assigned to ${assignee?.name || 'team'}${targetProj ? ` in [${targetProj.key}] ${targetProj.name}` : ''}`,
      'success'
    );
  };

  // Update Task Status with completion confetti and notifications
  const updateTaskStatus = (taskId: string, status: TaskStatus) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const isCompleting = status === 'completed' && task.status !== 'completed';

    const updatedTask: Task = {
      ...task,
      status,
      completedAt: status === 'completed' ? new Date().toISOString() : undefined
    };

    setTasks(prev =>
      prev.map(t => (t.id === taskId ? updatedTask : t))
    );
    upsertTaskToSupabase(updatedTask);

    // If completing, fire celebration & notify manager / creator
    if (isCompleting) {
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.8 },
          colors: ['#10b981', '#059669', '#34d399', '#f59e0b', '#3b82f6']
        });
      } catch (e) {
        // graceful fallback if canvas-confetti unsupported
      }

      // Notify the manager (Shreyas Jadhav) or the task creator if different from current user
      const managerUser = users.find(u => u.role === 'manager') || users[0];
      const notifyUserId = task.createdById && task.createdById !== currentUser.id ? task.createdById : managerUser.id;

      if (notifyUserId !== currentUser.id) {
        const completionNotif: Notification = {
          id: `notif-${Date.now()}`,
          userId: notifyUserId,
          senderId: currentUser.id,
          title: 'Task Completed',
          message: `${currentUser.name} completed "${task.title}"`,
          type: 'completion',
          read: false,
          createdAt: new Date().toISOString(),
          taskId: task.id,
          projectId: task.projectId
        };
        setNotifications(prev => [completionNotif, ...prev]);
        upsertNotificationToSupabase(completionNotif);
      }

      dispatchSystemNotification('Task Completed! 🎉', {
        body: `"${task.title}" marked as completed by ${currentUser.name}`,
        data: { taskId: task.id }
      });

      addToast('Task Completed! 🎉', `"${task.title}" marked as completed.`, 'success');
    } else {
      addToast('Status Updated', `Task moved to ${status.replace('_', ' ')}`, 'info');
      dispatchSystemNotification(`Task Status Updated`, {
        body: `"${task.title}" moved to ${status.replace('_', ' ')}`,
        data: { taskId: task.id }
      });
    }

    // Add activity
    const actionMap: Record<TaskStatus, string> = {
      todo: 'moved task to To Do',
      in_progress: 'started working on',
      blocked: 'flagged blocker on',
      completed: 'completed task'
    };
    const newAct: ActivityLog = {
      id: `act-${Date.now()}`,
      userId: currentUser.id,
      action: actionMap[status],
      target: task.title,
      timestamp: 'Just now',
      type: 'status'
    };
    setActivities(prev => [newAct, ...prev]);
    insertActivityToSupabase(newAct);
  };

  // General task field update
  const updateTask = (taskId: string, updates: Partial<Task>) => {
    const oldTask = tasks.find(t => t.id === taskId);
    if (!oldTask) return;

    if (updates.assigneeId && updates.assigneeId !== oldTask.assigneeId && currentUser.role !== 'manager') {
      addToast('Permission Denied', 'Only Managers are authorized to reassign tasks.', 'warning');
      return;
    }

    const updatedTask: Task = { ...oldTask, ...updates };
    setTasks(prev => prev.map(t => (t.id === taskId ? updatedTask : t)));
    upsertTaskToSupabase(updatedTask);

    // If reassigned to someone new, notify them
    if (updates.assigneeId && updates.assigneeId !== oldTask.assigneeId) {
      const newAssignee = users.find(u => u.id === updates.assigneeId);
      if (newAssignee && newAssignee.id !== currentUser.id) {
        const notif: Notification = {
          id: `notif-${Date.now()}`,
          userId: newAssignee.id,
          senderId: currentUser.id,
          title: 'Task Reassigned',
          message: `${currentUser.name} reassigned "${oldTask.title}" to you.`,
          type: 'reassignment',
          read: false,
          createdAt: new Date().toISOString(),
          taskId: oldTask.id,
          projectId: oldTask.projectId
        };
        setNotifications(prev => [notif, ...prev]);
        upsertNotificationToSupabase(notif);
      }
    }

    addToast('Task Updated', `Changes saved successfully`, 'info');
  };

  // Delete task
  const deleteTask = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    setTasks(prev => prev.filter(t => t.id !== taskId));
    deleteTaskFromSupabase(taskId);
    if (task) {
      addToast('Task Deleted', `"${task.title}" was removed`, 'info');
    }
  };

  // Notification actions
  const markNotificationRead = (id: string) => {
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllNotificationsRead = () => {
    setNotifications(prev => prev.map(n => (n.userId === currentUser.id ? { ...n, read: true } : n)));
    addToast('All Caught Up', 'Marked all notifications as read', 'info');
  };

  // Dispatch real alert notification & ring
  const sendNotification = (
    title: string,
    message: string,
    tone: 'chime' | 'ring' | 'success' | 'message' = 'ring'
  ) => {
    const newNotif: Notification = {
      id: `notif-${Date.now()}`,
      userId: currentUser.id,
      senderId: currentUser.id,
      title,
      message,
      type: 'system',
      read: false,
      createdAt: new Date().toISOString()
    };
    setNotifications(prev => [newNotif, ...prev]);
    dispatchSystemNotification(title, {
      body: message
    });
  };

  // Send lightweight message
  const sendMessage = (text: string, channelId?: string, recipientId?: string) => {
    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderAvatar: currentUser.avatar,
      senderRole: currentUser.role,
      senderTitle: currentUser.title,
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      channelId: channelId || 'ch-team-chat',
      recipientId
    };
    setMessages(prev => [...prev, newMsg]);
    dispatchSystemNotification(`Message from ${currentUser.name}`, {
      body: text
    });
  };

  // Reset data to pristine production state
  const resetAllData = async () => {
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('taskflow_')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(k => localStorage.removeItem(k));
    } catch (e) {
      console.warn('Failed clearing localStorage:', e);
    }

    setUsers(INITIAL_USERS);
    setCurrentUserId('user-1');
    setProjects([]);
    setTasks([]);
    setNotifications([]);
    setActivities([]);
    setMessages([]);
    setCurrentView('dashboard');
    setSelectedProjectId(null);
    setSelectedTaskId(null);

    await clearAllCloudDataFromSupabase().catch(() => {});

    addToast('Production Environment Ready', 'Reset all tasks, projects, chats, and progress to clean state.', 'success');
  };

  // Authentication methods
  const login = async (usernameOrEmail: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const rawInput = usernameOrEmail.trim().toLowerCase();
    if (!rawInput) {
      return { success: false, error: 'Please enter your username or work email.' };
    }
    if (!password) {
      return { success: false, error: 'Please enter your account password.' };
    }

    // Match by username, email, full name, or email username prefix
    const matchedUser = users.find(u => {
      const emailLower = u.email.toLowerCase();
      const usernameLower = (u.username || u.email.split('@')[0]).toLowerCase();
      const nameLower = u.name.toLowerCase();
      const emailPrefix = u.email.split('@')[0].toLowerCase();
      return (
        emailLower === rawInput ||
        usernameLower === rawInput ||
        nameLower === rawInput ||
        emailPrefix === rawInput ||
        ((rawInput === 'shreyasjadhav@gmail.com' || rawInput === 'shreyasjadhav' || rawInput === 'shreyas') && u.id === 'user-1')
      );
    });

    if (!matchedUser) {
      return {
        success: false,
        error: `No account found for "${usernameOrEmail}". Try using Shreyas Jadhav (shreyasjadhav@gmail.com) or Alex Morgan (alex.morgan).`
      };
    }

    // Check password
    const expectedPassword = matchedUser.password || (matchedUser.id === 'user-1' ? 'shreyas123' : 'password123');
    const isPasswordValid =
      password === expectedPassword ||
      (matchedUser.id === 'user-1' && (password === 'shreyas123' || password === 'password123')) ||
      password === 'password123' ||
      password === 'taskflow123';

    if (!isPasswordValid) {
      return {
        success: false,
        error: matchedUser.id === 'user-1'
          ? 'Incorrect password. Password for Shreyas Jadhav is "shreyas123".'
          : 'Incorrect password. Default demo password for all accounts is "password123".'
      };
    }

    // Set authenticated state & current user
    setCurrentUserId(matchedUser.id);
    setIsAuthenticated(true);
    localStorage.setItem(`${STORAGE_KEY}_is_authenticated`, 'true');
    localStorage.setItem(`${STORAGE_KEY}_currentUserId`, matchedUser.id);

    // Record login activity
    const newAct: ActivityLog = {
      id: `act-${Date.now()}`,
      userId: matchedUser.id,
      action: 'signed in to workspace as',
      target: matchedUser.role === 'manager' ? 'Manager (Full Admin Access)' : `${matchedUser.title} (${matchedUser.role})`,
      timestamp: 'Just now',
      type: 'system'
    };
    setActivities(prev => [newAct, ...prev]);
    insertActivityToSupabase(newAct);

    try {
      confetti({
        particleCount: 45,
        spread: 60,
        origin: { y: 0.7 }
      });
    } catch {
      // ignore
    }

    addToast(
      `Welcome, ${matchedUser.name}! 👋`,
      `Signed in as ${matchedUser.role === 'manager' ? 'Manager' : 'Employee'}. Workspace unlocked.`,
      'success'
    );

    return { success: true };
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.setItem(`${STORAGE_KEY}_is_authenticated`, 'false');
    addToast('Signed Out', 'You have been safely signed out of TaskFlow.', 'info');
  };

  // User-specific notifications
  const userNotifications = useMemo(() => {
    return notifications.filter(n => n.userId === currentUser.id);
  }, [notifications, currentUser.id]);

  const unreadCount = useMemo(() => {
    return userNotifications.filter(n => !n.read).length;
  }, [userNotifications]);

  // Tasks assigned to current user
  const assignedTasks = useMemo(() => {
    return tasks.filter(t => t.assigneeId === currentUser.id);
  }, [tasks, currentUser.id]);

  return (
    <AppContext.Provider
      value={{
        currentUser,
        users,
        tasks,
        projects,
        notifications,
        activities,
        devPipelines,
        devLogs,
        messages,
        currentView,
        selectedProjectId,
        selectedTaskId,
        searchQuery,
        isCreateModalOpen,
        isCreateProjectModalOpen,
        isCreateEmployeeModalOpen,
        isRoleSwitcherOpen,
        isSearchOpen,
        toasts,

        setCurrentView,
        setSelectedProjectId,
        setSelectedTaskId,
        setSearchQuery,
        setIsCreateModalOpen,
        setIsCreateProjectModalOpen,
        setIsCreateEmployeeModalOpen,
        setIsSearchOpen,
        createEmployee,
        deleteEmployee,
        setIsRoleSwitcherOpen,
        switchRole,
        switchUser,
        setUserPresence,
        setMemberPresence,
        updateProjectProgress,
        updateProjectMembers,
        createProject,
        createTask,
        updateTaskStatus,
        updateTask,
        deleteTask,
        markNotificationRead,
        markAllNotificationsRead,
        sendNotification,
        sendMessage,
        resetAllData,
        addToast,
        removeToast,
        syncWithSupabase,

        supabaseStatus,
        supabaseLatencyMs,

        unreadCount,
        userNotifications,
        assignedTasks,

        isAuthenticated,
        login,
        logout
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
