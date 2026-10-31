import React, { createContext, useContext, useState, useEffect, useMemo, useRef, ReactNode } from 'react';
import confetti from 'canvas-confetti';
import { dispatchSystemNotification } from '../lib/notifications';
import { soundManager } from '../lib/notificationSound';
import { realtimeSync } from '../lib/realtimeSync';
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
  fetchMessagesFromSupabase,
  insertMessageToSupabase,
  clearMessagesFromSupabase,
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
  clearMessages: () => void;
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
  // Load persisted state or defaults: strictly only Shreyas and Sahil
  const [users, setUsers] = useState<User[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_users`);
      if (saved) {
        const parsed: User[] = JSON.parse(saved);
        const filtered = parsed.filter(u =>
          u.email === 'shreyasjadhav@gmail.com' ||
          u.email === 'sahilparbale@gmail.com' ||
          u.id === 'user-1' ||
          u.name.toLowerCase().includes('shreyas') ||
          u.name.toLowerCase().includes('sahil')
        );
        if (filtered.length >= 2) {
          return filtered.map(u => {
            if (u.id === 'user-1' || u.name.toLowerCase().includes('shreyas') || u.email?.includes('shreyas')) {
              return {
                ...u,
                id: 'user-1',
                name: 'Shreyas Jadhav',
                email: 'shreyasjadhav@gmail.com',
                username: 'shreyasjadhav',
                password: 'shreyas123',
                avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
                role: 'manager' as Role
              };
            }
            return {
              ...u,
              id: 'user-2',
              name: 'Sahil Parbale',
              email: 'sahilparbale@gmail.com',
              username: 'sahil',
              password: u.password || 'password123',
              avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
              role: 'employee' as Role,
              title: 'Lead Full-Stack Engineer',
              department: 'Engineering'
            };
          });
        }
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
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_projects`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [tasks, setTasks] = useState<Task[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_tasks`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [notifications, setNotifications] = useState<Notification[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_notifications`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [activities, setActivities] = useState<ActivityLog[]>(() => {
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

  // Stable references for realtime subscription and background polling to eliminate stale closures
  const currentUserIdRef = useRef(currentUserId);
  const currentUserRef = useRef(currentUser);

  useEffect(() => {
    currentUserIdRef.current = currentUserId;
    currentUserRef.current = currentUser;
  }, [currentUserId, currentUser]);

  // Robust check to prevent any self-notifications (sound chime, OS banner, or toast)
  // for messages and actions sent by the current user across all IDs, names, or usernames.
  const isSelf = (senderId?: string, senderName?: string): boolean => {
    const activeId = currentUserIdRef.current;
    const activeUser = currentUserRef.current;
    if (senderId && activeId && senderId === activeId) return true;
    if (activeUser) {
      if (senderId && (senderId === activeUser.id || senderId === activeUser.username || senderId === activeUser.email)) return true;
      if (senderName && (senderName === activeUser.name || senderName.toLowerCase() === activeUser.name.toLowerCase())) return true;
      if (activeUser.name && senderName) {
        const uFirst = activeUser.name.split(' ')[0].toLowerCase();
        const sFirst = senderName.split(' ')[0].toLowerCase();
        if (uFirst && sFirst && uFirst === sFirst) return true;
      }
    }
    return false;
  };

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

  // Realtime Multi-Client Continuous Sync Engine
  const pullCloudChanges = async (isSilent: boolean = false) => {
    try {
      const health = await checkSupabaseHealth();
      setSupabaseStatus(health.status);
      setSupabaseLatencyMs(health.latencyMs);

      if (health.status === 'connected') {
        const [cloudUsers, cloudProjects, cloudTasks, cloudActivities, cloudNotifs, cloudMessages] = await Promise.all([
          fetchUsersFromSupabase(),
          fetchProjectsFromSupabase(),
          fetchTasksFromSupabase(),
          fetchActivitiesFromSupabase(),
          fetchNotificationsFromSupabase(),
          fetchMessagesFromSupabase()
        ]);

        // Sync Users & Live Presence
        if (cloudUsers && cloudUsers.length > 0) {
          setUsers(prevUsers => {
            const updated = prevUsers.map(localUser => {
              const matchedCloud = cloudUsers.find(cu => cu.id === localUser.id || cu.email === localUser.email);
              if (matchedCloud) {
                return {
                  ...localUser,
                  presence: matchedCloud.presence || localUser.presence,
                  title: matchedCloud.title || localUser.title,
                  department: matchedCloud.department || localUser.department,
                  role: matchedCloud.role || localUser.role
                };
              }
              return localUser;
            });

            // Append any team members added from another session
            cloudUsers.forEach(cu => {
              if (!updated.some(u => u.id === cu.id)) {
                updated.push(cu);
              }
            });

            return updated;
          });
        }

        // Sync Tasks & Ring Notification for newly assigned tasks
        if (cloudTasks) {
          setTasks(prevTasks => {
            if (isSilent) {
              const prevIds = new Set(prevTasks.map(t => t.id));
              const newlyAssigned = cloudTasks.filter(t => !prevIds.has(t.id) && t.assigneeId === currentUserId);
              if (newlyAssigned.length > 0) {
                soundManager.play('ring');
                newlyAssigned.forEach(nt => {
                  dispatchSystemNotification('New Task Assigned 📋', {
                    body: `Manager assigned you: "${nt.title}"`,
                    data: { taskId: nt.id }
                  });
                  addToast('New Task Assigned 📋', `You were assigned: "${nt.title}"`, 'info');
                });
              }
            }
            return cloudTasks;
          });
        }

        // Sync Projects
        if (cloudProjects) {
          setProjects(cloudProjects);
        }

        // Sync Activities
        if (cloudActivities) {
          setActivities(cloudActivities);
        }

        // Sync Notifications
        if (cloudNotifs) {
          setNotifications(prevNotifs => {
            if (isSilent) {
              const prevIds = new Set(prevNotifs.map(n => n.id));
              const newlyReceived = cloudNotifs.filter(
                n => !prevIds.has(n.id) && (n.userId === currentUserIdRef.current || !n.userId) && !isSelf(n.senderId)
              );
              if (newlyReceived.length > 0) {
                soundManager.play('ring');
                newlyReceived.forEach(nn => {
                  dispatchSystemNotification(nn.title, {
                    body: nn.message,
                    data: { taskId: nn.taskId, projectId: nn.projectId }
                  });
                });
              }
            }
            return cloudNotifs;
          });
        }

        // Sync Messages (Team Chat)
        if (cloudMessages !== null) {
          setMessages(prevMessages => {
            if (cloudMessages.length === 0) {
              return [];
            }
            if (isSilent) {
              const prevIds = new Set(prevMessages.map(m => m.id));
              // Filter out messages already seen or sent by the active user themselves
              const newIncoming = cloudMessages.filter(
                m => !prevIds.has(m.id) && !isSelf(m.senderId, m.senderName)
              );
              if (newIncoming.length > 0) {
                const latest = newIncoming[newIncoming.length - 1];
                soundManager.play('message');
                dispatchSystemNotification(`💬 ${latest.senderName || 'Team Chat'}`, {
                  body: latest.text,
                  data: { channelId: latest.channelId }
                });
                addToast(`💬 ${latest.senderName || 'Team Member'}`, latest.text, 'info');
              }
            }
            // Merge so cloud messages are unified with local messages
            const merged = [...cloudMessages];
            prevMessages.forEach(pm => {
              if (!merged.some(cm => cm.id === pm.id)) {
                merged.push(pm);
              }
            });
            return merged;
          });
        }

        if (!isSilent) {
          addToast('Supabase Connected 🟢', `Cloud DB in sync (${health.latencyMs}ms)`, 'success');
        }
      }
    } catch (err) {
      if (!isSilent) {
        console.warn('Error syncing with Supabase:', err);
      }
    }
  };

  const syncWithSupabase = () => pullCloudChanges(false);

  // 1. Instant Cross-Tab & Cross-Window Realtime Subscription (< 5ms delivery)
  useEffect(() => {
    const unsubscribe = realtimeSync.subscribe(event => {
      switch (event.type) {
        case 'PRESENCE_UPDATED': {
          const { userId, presence } = event.payload;
          setUsers(prev => prev.map(u => (u.id === userId ? { ...u, presence } : u)));
          break;
        }
        case 'TASK_CREATED': {
          const newTask: Task = event.payload;
          setTasks(prev => {
            if (prev.some(t => t.id === newTask.id)) return prev;
            return [newTask, ...prev];
          });
          if (newTask.assigneeId === currentUserIdRef.current && !isSelf(newTask.createdById)) {
            soundManager.play('ring');
            dispatchSystemNotification('New Task Assigned 📋', {
              body: `Manager assigned you: "${newTask.title}"`,
              data: { taskId: newTask.id }
            });
            addToast('New Task Assigned 📋', `You have been assigned: "${newTask.title}"`, 'info');
          }
          break;
        }
        case 'TASK_UPDATED': {
          const { taskId, updates } = event.payload;
          setTasks(prev => prev.map(t => (t.id === taskId ? { ...t, ...updates } : t)));
          break;
        }
        case 'TASK_DELETED': {
          const { taskId } = event.payload;
          setTasks(prev => prev.filter(t => t.id !== taskId));
          break;
        }
        case 'PROJECT_CREATED': {
          const newProj: Project = event.payload;
          setProjects(prev => (prev.some(p => p.id === newProj.id) ? prev : [newProj, ...prev]));
          break;
        }
        case 'PROJECT_UPDATED': {
          const { projectId, updates } = event.payload;
          setProjects(prev => prev.map(p => (p.id === projectId ? { ...p, ...updates } : p)));
          break;
        }
        case 'MESSAGE_SENT': {
          const newMsg: ChatMessage = event.payload;
          setMessages(prev => (prev.some(m => m.id === newMsg.id) ? prev : [...prev, newMsg]));
          // Strictly suppress incoming notification ring, system notification & toast if sent by self
          if (!isSelf(newMsg.senderId, newMsg.senderName)) {
            soundManager.play('message');
            dispatchSystemNotification(`💬 ${newMsg.senderName || 'Team Member'}`, {
              body: newMsg.text,
              data: { channelId: newMsg.channelId }
            });
            addToast(`💬 ${newMsg.senderName || 'Team Member'}`, newMsg.text, 'info');
          }
          break;
        }
        case 'MESSAGES_CLEARED': {
          setMessages([]);
          try {
            localStorage.removeItem(`${STORAGE_KEY}_messages`);
          } catch {
            // ignore
          }
          break;
        }
        case 'NOTIFICATION_CREATED': {
          const newNotif: Notification = event.payload;
          if (newNotif.userId === currentUserIdRef.current || !newNotif.userId) {
            setNotifications(prev => (prev.some(n => n.id === newNotif.id) ? prev : [newNotif, ...prev]));
            // Strictly suppress notification ring and banner for sender self
            if (!isSelf(newNotif.senderId)) {
              soundManager.play('ring');
              dispatchSystemNotification(newNotif.title, {
                body: newNotif.message,
                data: { taskId: newNotif.taskId, projectId: newNotif.projectId }
              });
              addToast(newNotif.title, newNotif.message, 'info');
            }
          }
          break;
        }
        case 'NOTIFICATION_READ': {
          const { id } = event.payload;
          setNotifications(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)));
          break;
        }
        case 'ALL_NOTIFICATIONS_READ': {
          const { userId } = event.payload;
          setNotifications(prev => prev.map(n => (n.userId === userId || !n.userId ? { ...n, read: true } : n)));
          break;
        }
        case 'USER_CREATED': {
          const newUser: User = event.payload;
          setUsers(prev => (prev.some(u => u.id === newUser.id) ? prev : [...prev, newUser]));
          break;
        }
        case 'USER_DELETED': {
          const { userId } = event.payload;
          setUsers(prev => prev.filter(u => u.id !== userId));
          break;
        }
      }
    });

    return () => unsubscribe();
  }, [currentUserId]);

  // 2. Continuous Cloud Polling Heartbeat (every 3 seconds) & Window Focus/Visibility triggers
  useEffect(() => {
    pullCloudChanges(true);

    const intervalId = setInterval(() => {
      pullCloudChanges(true);
    }, 3000);

    const handleFocus = () => pullCloudChanges(true);
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        pullCloudChanges(true);
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [currentUserId]);

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
    realtimeSync.broadcast('PROJECT_UPDATED', {
      projectId,
      updates: { progress: clamped, health: newHealth || targetProj.health, lastUpdatedBy: currentUser.name, lastUpdatedAt: 'Just now' }
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
    realtimeSync.broadcast('PROJECT_CREATED', newProject);

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
    realtimeSync.broadcast('PROJECT_UPDATED', {
      projectId,
      updates: { members: safeMembers, lastUpdatedBy: currentUser.name, lastUpdatedAt: 'Just now' }
    });

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
    realtimeSync.broadcast('USER_CREATED', newUser);

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
    insertMessageToSupabase(welcomeMsg);
    realtimeSync.broadcast('MESSAGE_SENT', welcomeMsg);

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
    realtimeSync.broadcast('USER_DELETED', { userId });
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
      pullCloudChanges(true);
    }
  };

  // Set member presence (Online, On Break, Offline) with live timing tracking
  const setMemberPresence = (userId: string, presence: PresenceStatus) => {
    const targetUser = users.find(u => u.id === userId);
    if (!targetUser) return;

    const updatedUser = { ...targetUser, presence };
    setUsers(prev => prev.map(u => (u.id === userId ? updatedUser : u)));
    upsertUserToSupabase(updatedUser);
    realtimeSync.broadcast('PRESENCE_UPDATED', { userId, presence });

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
    realtimeSync.broadcast('TASK_CREATED', newTask);

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
      upsertNotificationToSupabase(newNotif);
      realtimeSync.broadcast('NOTIFICATION_CREATED', newNotif);
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
    realtimeSync.broadcast('TASK_UPDATED', { taskId, updates: { status, completedAt: updatedTask.completedAt } });

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
        realtimeSync.broadcast('NOTIFICATION_CREATED', completionNotif);
      }

      soundManager.play('success');
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
    realtimeSync.broadcast('TASK_UPDATED', { taskId, updates });

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
        realtimeSync.broadcast('NOTIFICATION_CREATED', notif);
      }
    }

    addToast('Task Updated', `Changes saved successfully`, 'info');
  };

  // Delete task
  const deleteTask = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    setTasks(prev => prev.filter(t => t.id !== taskId));
    deleteTaskFromSupabase(taskId);
    realtimeSync.broadcast('TASK_DELETED', { taskId });
    if (task) {
      addToast('Task Deleted', `"${task.title}" was removed`, 'info');
    }
  };

  // Notification actions
  const markNotificationRead = (id: string) => {
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)));
    realtimeSync.broadcast('NOTIFICATION_READ', { id });
  };

  const markAllNotificationsRead = () => {
    setNotifications(prev => prev.map(n => (n.userId === currentUser.id ? { ...n, read: true } : n)));
    realtimeSync.broadcast('ALL_NOTIFICATIONS_READ', { userId: currentUser.id });
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
    upsertNotificationToSupabase(newNotif);
    realtimeSync.broadcast('NOTIFICATION_CREATED', newNotif);
    soundManager.play(tone);
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
    insertMessageToSupabase(newMsg);
    realtimeSync.broadcast('MESSAGE_SENT', newMsg);
    // Note: Do not play incoming chime or trigger notifications for the sender's own message
  };

  // Clear all team chat messages
  const clearMessages = () => {
    setMessages([]);
    try {
      localStorage.removeItem(`${STORAGE_KEY}_messages`);
    } catch (e) {
      console.warn('Failed clearing local messages:', e);
    }
    clearMessagesFromSupabase();
    realtimeSync.broadcast('MESSAGES_CLEARED', {});
    addToast('Chat Cleared', 'All messages have been cleared from Team Chat.', 'info');
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
        ((rawInput === 'shreyasjadhav@gmail.com' || rawInput === 'shreyasjadhav' || rawInput === 'shreyas') && u.id === 'user-1') ||
        ((rawInput === 'sahilparbale@gmail.com' || rawInput === 'sahil' || rawInput === 'sahilparbale') && (u.id === 'user-2' || u.name.includes('Sahil')))
      );
    });

    if (!matchedUser) {
      return {
        success: false,
        error: `No account found for "${usernameOrEmail}". Try using Shreyas Jadhav (shreyasjadhav@gmail.com) or Sahil Parbale (sahilparbale@gmail.com / sahil).`
      };
    }

    // Check password
    const expectedPassword = matchedUser.password || (matchedUser.id === 'user-1' ? 'shreyas123' : 'password123');
    const isPasswordValid =
      password === expectedPassword ||
      (matchedUser.id === 'user-1' && (password === 'shreyas123' || password === 'password123')) ||
      (matchedUser.id === 'user-2' && (password === 'sahil123' || password === 'password123')) ||
      password === 'password123' ||
      password === 'taskflow123';

    if (!isPasswordValid) {
      return {
        success: false,
        error: matchedUser.id === 'user-1'
          ? 'Incorrect password. Password for Shreyas Jadhav is "shreyas123".'
          : 'Incorrect password. Password for Sahil Parbale is "password123" or "sahil123".'
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

    // Immediately trigger cloud sync for newly authenticated user
    pullCloudChanges(true);

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
        clearMessages,
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
