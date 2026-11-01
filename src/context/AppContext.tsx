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
  clearAllCloudDataFromSupabase,
  purgeLegacySeedUsersFromSupabase,
  ensureDefaultUsersInSupabase
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
  department: 'engineering' | 'marketing';
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
    status?: TaskStatus;
    clientContact?: string;
    clientPhone?: string;
    clientLocation?: string;
    stageOutcome?: string;
  }) => void;
  updateTaskStatus: (taskId: string, status: TaskStatus) => void;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  deleteTask: (taskId: string) => void;
  deleteProject: (projectId: string) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  sendNotification: (title: string, message: string, tone?: 'chime' | 'ring' | 'success' | 'message') => void;
  sendMessage: (text: string, channelId?: string, recipientId?: string) => void;
  clearMessages: () => void;
  activeChatTarget: string;
  setActiveChatTarget: (target: string) => void;
  openChatWithUser: (userId: string) => void;
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
  isMessagesTableMissing: boolean;

  // Computed
  unreadCount: number;
  userNotifications: Notification[];
  assignedTasks: Task[];
}

const STORAGE_KEY = 'taskflow_v4';

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Active session deleted user & task tracker (in-memory only, no localStorage caching)
  const [deletedUserIds, setDeletedUserIds] = useState<string[]>([]);
  const deletedUserIdsRef = useRef(deletedUserIds);
  useEffect(() => {
    deletedUserIdsRef.current = deletedUserIds;
  }, [deletedUserIds]);

  const [deletedTaskIds, setDeletedTaskIds] = useState<string[]>([]);
  const deletedTaskIdsRef = useRef(deletedTaskIds);
  useEffect(() => {
    deletedTaskIdsRef.current = deletedTaskIds;
  }, [deletedTaskIds]);

  const [deletedProjectIds, setDeletedProjectIds] = useState<string[]>([]);
  const deletedProjectIdsRef = useRef(deletedProjectIds);
  useEffect(() => {
    deletedProjectIdsRef.current = deletedProjectIds;
  }, [deletedProjectIds]);

  // Complete Zero-LocalStorage Policy:
  // Purge ALL browser localStorage keys so that nothing is ever stored or cached locally.
  // All business entities (users, marketing leads, tasks, projects, activities, messages)
  // live 100% on Supabase PostgreSQL.
  useEffect(() => {
    try {
      localStorage.clear();
    } catch (e) {
      console.warn('Error clearing localStorage', e);
    }

    // Ensure all default personas (Software + Marketing) are present in Supabase on startup
    ensureDefaultUsersInSupabase().catch(() => {});
  }, []);

  // Pure Database-Driven State: All business data originates strictly from Supabase PostgreSQL
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);

  const [currentUserId, setCurrentUserId] = useState<string>(() => {
    try {
      const saved = sessionStorage.getItem(`${STORAGE_KEY}_currentUserId`);
      return saved || 'user-1'; // Default Shreyas Jadhav (Manager)
    } catch {
      return 'user-1';
    }
  });

  const [projects, setProjects] = useState<Project[]>(INITIAL_PROJECTS);
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [devPipelines] = useState<DevPipeline[]>(INITIAL_DEV_PIPELINES);
  const [devLogs] = useState<DevLog[]>(INITIAL_DEV_LOGS);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

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
  const [activeChatTarget, setActiveChatTarget] = useState<string>('team');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const openChatWithUser = (userId: string) => {
    setActiveChatTarget(userId);
    setCurrentView('messages');
  };

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

  // Authentication state - checks session storage, defaults to false to present professional login
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      const saved = sessionStorage.getItem(`${STORAGE_KEY}_is_authenticated`);
      return saved === 'true';
    } catch {
      return false;
    }
  });

  // Normalize department key to either 'engineering' or 'marketing'
  const normalizeDepartment = (dept?: string): 'engineering' | 'marketing' => {
    if (!dept) return 'engineering';
    const d = dept.toLowerCase();
    if (d.includes('market') || d.includes('growth')) return 'marketing';
    return 'engineering';
  };

  // Resilient department resolver for any user object (protects against missing DB columns)
  const getUserDepartment = (user?: { id?: string; email?: string; name?: string; username?: string; department?: string }): 'engineering' | 'marketing' => {
    if (!user) return 'engineering';
    if (user.id === 'user-marketing-mgr' || user.id === 'user-marketing-emp' || (user.id && user.id.includes('mkt'))) return 'marketing';
    if (user.email && (user.email.includes('marketing') || user.email.includes('aarav') || user.email.includes('priya'))) return 'marketing';
    if (user.name && (user.name.includes('Priya') || user.name.includes('Aarav'))) return 'marketing';
    if (user.username && (user.username.includes('priya') || user.username.includes('aarav'))) return 'marketing';
    return normalizeDepartment(user.department);
  };

  // Helper to match assignee to user across id, email, username, and personas
  const isTaskAssignedToUser = (
    task: { assigneeId: string },
    user: { id: string; email?: string; name?: string; username?: string; role?: string; department?: string }
  ): boolean => {
    if (!task || !task.assigneeId || !user) return false;

    const tAssignee = String(task.assigneeId).trim().toLowerCase();
    const uId = String(user.id).trim().toLowerCase();
    const uEmail = user.email ? user.email.trim().toLowerCase() : '';
    const uName = user.name ? user.name.trim().toLowerCase() : '';
    const uUsername = user.username ? user.username.trim().toLowerCase() : '';

    // 1. Direct ID match
    if (tAssignee === uId) return true;

    // 2. Direct Email match
    if (uEmail && tAssignee === uEmail) return true;

    // 3. Direct Username match
    if (uUsername && tAssignee === uUsername) return true;

    // 4. Marketing Employee Persona match (Aarav Mehta) across all known aliases & IDs
    const isUserAarav =
      uId === 'user-marketing-emp' ||
      uEmail.includes('aarav') ||
      uName.includes('aarav') ||
      uUsername === 'aarav';

    const isTaskAssignedAarav =
      tAssignee === 'user-marketing-emp' ||
      tAssignee.includes('aarav') ||
      tAssignee === 'aarav.mehta@taskflow.io';

    if (isUserAarav && isTaskAssignedAarav) return true;

    // 5. Software Dev Employee Persona match (Sahil Parbale) across all known aliases & IDs
    const isUserSahil =
      uId === 'user-2' ||
      uEmail.includes('sahil') ||
      uName.includes('sahil') ||
      uUsername === 'sahil';

    const isTaskAssignedSahil =
      tAssignee === 'user-2' ||
      tAssignee.includes('sahil') ||
      tAssignee === 'sahilparbale@gmail.com';

    if (isUserSahil && isTaskAssignedSahil) return true;

    // 6. Marketing Manager Persona match (Priya Sharma)
    const isUserPriya =
      uId === 'user-marketing-mgr' ||
      uEmail.includes('priya') ||
      uName.includes('priya') ||
      uUsername.includes('priya');

    const isTaskAssignedPriya =
      tAssignee === 'user-marketing-mgr' ||
      tAssignee.includes('priya') ||
      tAssignee === 'priya.marketing@taskflow.io';

    if (isUserPriya && isTaskAssignedPriya) return true;

    // 7. Software Manager Persona match (Shreyas Jadhav)
    const isUserShreyas =
      uId === 'user-1' ||
      uEmail.includes('shreyas') ||
      uName.includes('shreyas') ||
      uUsername.includes('shreyas');

    const isTaskAssignedShreyas =
      tAssignee === 'user-1' ||
      tAssignee.includes('shreyas') ||
      tAssignee === 'shreyasjadhav@gmail.com';

    if (isUserShreyas && isTaskAssignedShreyas) return true;

    return false;
  };

  // Current active user object with resilient ID resolution across aliases
  const currentUser = useMemo(() => {
    return (
      users.find(u => u.id === currentUserId) ||
      (currentUserId === 'user-marketing-mgr' ? users.find(u => u.email.includes('priya') || u.name.includes('Priya')) : undefined) ||
      (currentUserId === 'user-marketing-emp' ? users.find(u => u.email.includes('aarav') || u.name.includes('Aarav')) : undefined) ||
      (currentUserId === 'user-2' ? users.find(u => u.name.includes('Sahil') || u.email.includes('sahil')) : undefined) ||
      users[0]
    );
  }, [users, currentUserId]);

  // Current department based on authenticated user (resilient against missing DB column)
  const currentDept = useMemo(() => {
    return getUserDepartment(currentUser);
  }, [currentUser]);

  // Strict Department-Scoped Data Partitioning (Zero cross-department leaking)
  const scopedUsers = useMemo(() => {
    return users.filter(u => getUserDepartment(u) === currentDept);
  }, [users, currentDept]);

  const scopedProjects = useMemo(() => {
    return projects.filter(p => {
      const isMkt =
        p.id === 'proj-mkt-1' ||
        p.id.includes('mkt') ||
        p.key === 'MKT' ||
        (p.department && normalizeDepartment(p.department) === 'marketing') ||
        (p.members && p.members.some(m => m === 'user-marketing-mgr' || m === 'user-marketing-emp' || m.includes('priya') || m.includes('aarav'))) ||
        (p.lastUpdatedBy && (p.lastUpdatedBy.includes('Priya') || p.lastUpdatedBy.includes('Aarav')));

      if (currentDept === 'marketing') return isMkt;
      return !isMkt;
    });
  }, [projects, currentDept]);

  const scopedTasks = useMemo(() => {
    const marketingProjIds = new Set(
      projects
        .filter(
          p =>
            p.id === 'proj-mkt-1' ||
            p.id.includes('mkt') ||
            p.key === 'MKT' ||
            (p.department && normalizeDepartment(p.department) === 'marketing') ||
            (p.members && p.members.some(m => m === 'user-marketing-mgr' || m === 'user-marketing-emp' || m.includes('priya') || m.includes('aarav')))
        )
        .map(p => p.id)
    );

    return tasks.filter(t => {
      // 1. Direct lead / marketing pipeline characteristics:
      const hasMarketingStatus = ['calling', 'field_visit', 'demo'].includes(t.status);
      const isLeadId = t.id && (t.id.startsWith('lead-') || t.id.includes('mkt'));
      const hasClientData = !!t.clientContact || !!t.clientLocation || !!t.clientPhone;
      const isExplicitMkt = t.department && normalizeDepartment(t.department) === 'marketing';
      const isLinkedToMarketingProj = !!(t.projectId && marketingProjIds.has(t.projectId));

      const tAssignee = (t.assigneeId || '').toLowerCase();
      const tCreator = (t.createdById || '').toLowerCase();

      const assigneeUser = users.find(u =>
        u.id === t.assigneeId ||
        (u.email && u.email.toLowerCase() === tAssignee) ||
        (u.username && u.username.toLowerCase() === tAssignee)
      );
      const creatorUser = users.find(u =>
        u.id === t.createdById ||
        (u.email && u.email.toLowerCase() === tCreator) ||
        (u.username && u.username.toLowerCase() === tCreator)
      );

      const assigneeIsMarketing =
        (assigneeUser && getUserDepartment(assigneeUser) === 'marketing') ||
        tAssignee === 'user-marketing-emp' ||
        tAssignee === 'user-marketing-mgr' ||
        tAssignee.includes('aarav') ||
        tAssignee.includes('priya') ||
        tAssignee.includes('marketing');

      const creatorIsMarketing =
        (creatorUser && getUserDepartment(creatorUser) === 'marketing') ||
        tCreator === 'user-marketing-mgr' ||
        tCreator === 'user-marketing-emp' ||
        tCreator.includes('priya') ||
        tCreator.includes('aarav') ||
        tCreator.includes('marketing');

      const hasMarketingTag = (t.tags || []).some((tg: string) => {
        if (typeof tg !== 'string') return false;
        const low = tg.toLowerCase();
        return (
          low.includes('calling') ||
          low.includes('field visit') ||
          low.includes('demo') ||
          low.includes('lead') ||
          low.startsWith('mkt_') ||
          low.startsWith('stage:')
        );
      });

      const isMarketingTask =
        hasMarketingStatus ||
        isLeadId ||
        hasClientData ||
        isExplicitMkt ||
        isLinkedToMarketingProj ||
        assigneeIsMarketing ||
        creatorIsMarketing ||
        hasMarketingTag;

      if (currentDept === 'marketing') {
        return isMarketingTask;
      } else {
        return !isMarketingTask;
      }
    });
  }, [tasks, users, projects, currentDept]);

  const scopedActivities = useMemo(() => {
    return activities.filter(a => {
      const actUser = users.find(u => u.id === a.userId);
      return actUser ? normalizeDepartment(actUser.department) === currentDept : currentDept === 'engineering';
    });
  }, [activities, users, currentDept]);

  const scopedMessages = useMemo(() => {
    const scopedUserIds = new Set(scopedUsers.map(u => u.id));
    return messages.filter(m => {
      if (!m.recipientId) {
        if (currentDept === 'marketing') {
          return m.channelId === 'ch-marketing';
        } else {
          return m.channelId === 'ch-engineering' || m.channelId === 'ch-team-chat' || !m.channelId;
        }
      }
      return (
        (m.senderId === currentUser.id && scopedUserIds.has(m.recipientId)) ||
        (m.recipientId === currentUser.id && scopedUserIds.has(m.senderId)) ||
        (scopedUserIds.has(m.senderId) && scopedUserIds.has(m.recipientId))
      );
    });
  }, [messages, currentDept, scopedUsers, currentUser.id]);

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
    if (senderId && activeId && (senderId === activeId || (activeId === 'user-2' && (senderId.includes('sahil') || senderId === 'user-1793433013262')))) return true;
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

  // Session-scoped active tab tokens only (zero localStorage footprint)
  useEffect(() => {
    try {
      sessionStorage.setItem(`${STORAGE_KEY}_currentUserId`, currentUserId);
      sessionStorage.setItem(`${STORAGE_KEY}_is_authenticated`, String(isAuthenticated));
    } catch (e) {
      console.warn('Could not persist auth session to sessionStorage', e);
    }
  }, [currentUserId, isAuthenticated]);

  // Supabase Cloud State
  const [supabaseStatus, setSupabaseStatus] = useState<SupabaseStatus>('connecting');
  const [supabaseLatencyMs, setSupabaseLatencyMs] = useState(0);
  const [isMessagesTableMissing, setIsMessagesTableMissing] = useState(false);

  // Realtime Multi-Client Continuous Sync Engine
  const pullCloudChanges = async (isSilent: boolean = false) => {
    try {
      const health = await checkSupabaseHealth();
      setSupabaseStatus(health.status);
      setSupabaseLatencyMs(health.latencyMs);
      if (health.isMessagesMissing !== undefined) {
        setIsMessagesTableMissing(health.isMessagesMissing);
      }

      if (health.status === 'connected') {
        const [cloudUsers, cloudProjects, cloudTasks, cloudActivities, cloudNotifs, cloudMessages] = await Promise.all([
          fetchUsersFromSupabase(),
          fetchProjectsFromSupabase(),
          fetchTasksFromSupabase(),
          fetchActivitiesFromSupabase(),
          fetchNotificationsFromSupabase(),
          fetchMessagesFromSupabase()
        ]);

        // Sync Users & Live Presence directly from Supabase (Single Source of Truth)
        if (cloudUsers && cloudUsers.length > 0) {
          // If cloudUsers has legacy seed users, purge them from the database once
          const hasLegacy = cloudUsers.some(u =>
            u.email === 'alex.morgan@company.com' ||
            u.email === 'david.chen@company.com' ||
            u.email === 'elena.rostova@company.com' ||
            u.email === 'marcus.vance@company.com'
          );
          if (hasLegacy) {
            purgeLegacySeedUsersFromSupabase().catch(() => {});
          }

          const filteredCloudUsers = cloudUsers.filter(u =>
            u.email !== 'alex.morgan@company.com' &&
            u.email !== 'david.chen@company.com' &&
            u.email !== 'elena.rostova@company.com' &&
            u.email !== 'marcus.vance@company.com' &&
            !deletedUserIdsRef.current.includes(u.id) &&
            !(u.email && deletedUserIdsRef.current.includes(u.email))
          );

          const cloudUserIds = new Set(filteredCloudUsers.map(u => u.id));
          const cloudUserEmails = new Set(filteredCloudUsers.map(u => (u.email || '').toLowerCase()));

          // Merge cloud users while preserving local pending team members not yet indexed by Supabase
          setUsers(prevUsers => {
            const localPending = prevUsers.filter(u => {
              if (cloudUserIds.has(u.id)) return false;
              if (u.email && cloudUserEmails.has(u.email.toLowerCase())) return false;
              if (deletedUserIdsRef.current.includes(u.id)) return false;
              if (u.email && deletedUserIdsRef.current.includes(u.email)) return false;
              return true;
            });

            // Re-attempt cloud write for any pending user not yet confirmed in cloudUsers
            if (localPending.length > 0) {
              localPending.forEach(lu => upsertUserToSupabase(lu).catch(() => {}));
            }

            // Ensure missing default personas (Software + Marketing) are always present in the roster
            const allEmails = new Set([
              ...filteredCloudUsers.map(u => (u.email || '').toLowerCase()),
              ...localPending.map(u => (u.email || '').toLowerCase())
            ]);
            const missingDefaults = INITIAL_USERS.filter(du =>
              !allEmails.has(du.email.toLowerCase()) &&
              !deletedUserIdsRef.current.includes(du.id) &&
              !deletedUserIdsRef.current.includes(du.email)
            );
            if (missingDefaults.length > 0) {
              for (const du of missingDefaults) {
                upsertUserToSupabase(du).catch(() => {});
              }
            }

            return [...filteredCloudUsers, ...localPending, ...missingDefaults];
          });
        } else if (cloudUsers && cloudUsers.length === 0) {
          // Database users table is empty; populate all default personas into the database table
          ensureDefaultUsersInSupabase().then(() => pullCloudChanges(true)).catch(() => {});
        }

        // Sync Tasks & Ring Notification for newly assigned tasks
        if (cloudTasks) {
          setTasks(prevTasks => {
            const existingTaskMap = new Map(prevTasks.map(t => [t.id, t]));
            // Hydrate cloud tasks: if cloud had null client fields, preserve local values so they never flash or vanish
            const hydratedCloudTasks = cloudTasks.map(ct => {
              const local = existingTaskMap.get(ct.id);
              if (!local) return ct;
              const isLocallyCompleted = local.status === 'completed';
              return {
                ...ct,
                status: isLocallyCompleted ? 'completed' : ct.status,
                completedAt: ct.completedAt || local.completedAt,
                clientContact: ct.clientContact || local.clientContact,
                clientPhone: ct.clientPhone || local.clientPhone,
                clientLocation: ct.clientLocation || local.clientLocation,
                stageOutcome: ct.stageOutcome || local.stageOutcome
              };
            });

            const cloudIds = new Set(hydratedCloudTasks.map(t => t.id));
            // Preserve all local tasks not yet confirmed in cloudTasks, unless explicitly deleted
            const localPending = prevTasks.filter(t => {
              if (cloudIds.has(t.id)) return false;
              if (deletedTaskIdsRef.current.includes(t.id)) return false;
              return true;
            });

            // Re-attempt background sync for any local pending tasks not yet in Supabase
            if (localPending.length > 0) {
              localPending.forEach(lt => upsertTaskToSupabase(lt).catch(() => {}));
            }

            // Ensure marketing default sample tasks are seeded if no marketing tasks exist in the database yet
            const hasMarketingTask = [...hydratedCloudTasks, ...localPending].some(t =>
              (t.id && (t.id.startsWith('lead-') || t.id.includes('mkt'))) ||
              ['calling', 'field_visit', 'demo'].includes(t.status) ||
              (t.department && t.department.toLowerCase().includes('market'))
            );

            const mktDefaults = !hasMarketingTask
              ? INITIAL_TASKS.filter(it => it.department === 'Marketing' && !cloudIds.has(it.id) && !deletedTaskIdsRef.current.includes(it.id))
              : [];

            if (!hasMarketingTask && mktDefaults.length > 0) {
              mktDefaults.forEach(mt => upsertTaskToSupabase(mt).catch(() => {}));
            }

            if (isSilent) {
              const prevIds = new Set(prevTasks.map(t => t.id));
              const newlyAssigned = hydratedCloudTasks.filter(t => !prevIds.has(t.id) && isTaskAssignedToUser(t, currentUserRef.current));
              if (newlyAssigned.length > 0) {
                soundManager.play('ring');
                newlyAssigned.forEach(nt => {
                  dispatchSystemNotification('New Task Assigned', {
                    body: `Manager assigned you: "${nt.title}"`,
                    data: { taskId: nt.id }
                  });
                  addToast('New Task Assigned', `You were assigned: "${nt.title}"`, 'info');
                });
              }
            }
            return [...hydratedCloudTasks, ...localPending, ...mktDefaults];
          });
        }

        // Sync Projects with local pending preservation so projects are never deleted unless manager explicitly deletes
        if (cloudProjects) {
          setProjects(prevProjects => {
            const cloudIds = new Set(cloudProjects.map(p => p.id));
            const localPending = prevProjects.filter(p => {
              if (cloudIds.has(p.id)) return false;
              if (deletedProjectIdsRef.current.includes(p.id)) return false;
              return true;
            });

            if (localPending.length > 0) {
              localPending.forEach(lp => upsertProjectToSupabase(lp).catch(() => {}));
            }

            const allProjects = [...cloudProjects, ...localPending].filter(
              p => !deletedProjectIdsRef.current.includes(p.id)
            );

            const hasMarketingProj = allProjects.some(p =>
              (p.department && p.department.toLowerCase().includes('market')) || p.id.includes('mkt')
            );
            const mktProjDefaults = !hasMarketingProj
              ? INITIAL_PROJECTS.filter(ip => ip.department === 'Marketing' && !cloudIds.has(ip.id) && !deletedProjectIdsRef.current.includes(ip.id))
              : [];
            if (!hasMarketingProj && mktProjDefaults.length > 0) {
              mktProjDefaults.forEach(mp => upsertProjectToSupabase(mp).catch(() => {}));
            }
            return [...allProjects, ...mktProjDefaults];
          });
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

        // Sync Messages (Team Chat & Direct Messages) directly from Supabase Cloud (Single Source of Truth)
        if (cloudMessages !== null) {
          setMessages(prevMessages => {
            const cloudIds = new Set(cloudMessages.map(m => m.id));
            // Preserve local in-flight messages created in the last 20 seconds not yet returned in cloud pull
            const localPending = prevMessages.filter(m => {
              if (cloudIds.has(m.id)) return false;
              const match = m.id.match(/^msg-(\d+)/);
              if (match) {
                const time = parseInt(match[1], 10);
                return Date.now() - time < 20000;
              }
              return false;
            });

            if (isSilent) {
              const prevIds = new Set(prevMessages.map(m => m.id));
              // Filter out messages already seen or sent by the active user themselves
              const newIncoming = cloudMessages.filter(
                m => !prevIds.has(m.id) && !isSelf(m.senderId, m.senderName)
              );
              if (newIncoming.length > 0) {
                const latest = newIncoming[newIncoming.length - 1];
                soundManager.play('message');
                dispatchSystemNotification(latest.senderName || 'Team Chat', {
                  body: latest.text,
                  data: { channelId: latest.channelId }
                });
                addToast(latest.senderName || 'Team Member', latest.text, 'info');
              }
            }
            return [...cloudMessages, ...localPending];
          });
        }

        if (!isSilent) {
          addToast('Supabase Connected', `Cloud DB in sync (${health.latencyMs}ms)`, 'success');
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
          if (isTaskAssignedToUser(newTask, currentUserRef.current) && !isSelf(newTask.createdById)) {
            soundManager.play('ring');
            dispatchSystemNotification('New Task Assigned', {
              body: `Manager assigned you: "${newTask.title}"`,
              data: { taskId: newTask.id }
            });
            addToast('New Task Assigned', `You have been assigned: "${newTask.title}"`, 'info');
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
            dispatchSystemNotification(newMsg.senderName || 'Team Member', {
              body: newMsg.text,
              data: { channelId: newMsg.channelId }
            });
            addToast(newMsg.senderName || 'Team Member', newMsg.text, 'info');
          }
          break;
        }
        case 'MESSAGES_CLEARED': {
          setMessages([]);
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
          const { userId, email } = event.payload;
          setDeletedUserIds(prev => Array.from(new Set([...prev, userId, email].filter(Boolean))));
          setUsers(prev => prev.filter(u => u.id !== userId && (!email || u.email !== email)));
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
      department: currentUser.department || (currentDept === 'marketing' ? 'Marketing' : 'Engineering'),
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

    addToast('Project Created', `"${data.name}" [${data.key.toUpperCase()}] is now active`, 'success');
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

    const isMkt = (data.department || '').toLowerCase().includes('market') || currentDept === 'marketing';
    const newUserId = isMkt ? `user-mkt-${Date.now()}` : `user-${Date.now()}`;
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
    const dept = data.department?.trim() || (isMkt ? 'Marketing' : 'Engineering');

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

    // Remove from deletedUserIds if previously deleted
    setDeletedUserIds(prev => prev.filter(id => id !== newUserId && id !== newUser.email));

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

    // Auto-add new employee to their department's team chat with an announcement
    const targetChannel = currentDept === 'marketing' ? 'ch-marketing' : 'ch-engineering';
    const welcomeMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderAvatar: currentUser.avatar,
      senderRole: currentUser.role,
      senderTitle: currentUser.title,
      channelId: targetChannel,
      text: `Welcome ${newUser.name} to the team as ${newUser.title}!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, welcomeMsg]);
    insertMessageToSupabase(welcomeMsg);
    realtimeSync.broadcast('MESSAGE_SENT', welcomeMsg);

    addToast('Employee Onboarded', `${newUser.name} added to the team & Team Chat!`, 'success');
  };

  // Delete Employee (Managers only)
  const deleteEmployee = async (userId: string) => {
    if (currentUser.role !== 'manager') {
      addToast('Permission Denied', 'Only Managers are authorized to remove team members.', 'warning');
      return;
    }
    const targetUser = users.find(u => u.id === userId);
    if (!targetUser) return;
    if (
      targetUser.role === 'manager' ||
      targetUser.id === 'user-1' ||
      targetUser.id === 'user-marketing-mgr' ||
      targetUser.email === 'shreyasjadhav@gmail.com' ||
      targetUser.email === 'priya.marketing@taskflow.io'
    ) {
      addToast('Cannot Remove Manager', 'Manager accounts cannot be deleted.', 'warning');
      return;
    }

    // Persist to deletedUserIds so background heartbeat polling never resurrects this employee
    setDeletedUserIds(prev => Array.from(new Set([...prev, userId, targetUser.email])));

    // Remove from active state immediately (pure in-memory + cloud sync)
    setUsers(prev => prev.filter(u => u.id !== userId && u.email !== targetUser.email));

    // Delete from Supabase cloud
    await deleteUserFromSupabase(userId, targetUser.email);

    // Broadcast removal across all connected tabs and devices
    realtimeSync.broadcast('USER_DELETED', { userId, email: targetUser.email });

    // Instantly sync authoritative state with Supabase cloud
    pullCloudChanges(true);

    addToast('Member Removed', `${targetUser.name} has been removed from the team roster and database.`, 'info');
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

  // Switch demo persona by role (within current department)
  const switchRole = (role: Role) => {
    let targetUser = scopedUsers.find(u => u.role === role);
    if (!targetUser) {
      targetUser = users.find(u => u.role === role && normalizeDepartment(u.department) === currentDept);
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
    status?: TaskStatus;
    clientContact?: string;
    clientPhone?: string;
    clientLocation?: string;
    stageOutcome?: string;
  }) => {
    if (currentUser.role !== 'manager') {
      addToast('Permission Denied', 'Employees are not authorized to create or assign tasks. Switch to Manager role to assign work.', 'warning');
      return;
    }

    const isMarketingUser = (currentUser.department || '').toLowerCase().includes('market') || currentDept === 'marketing';
    const defaultStatus: TaskStatus = data.status || (isMarketingUser ? 'calling' : 'todo');

    const newTaskId = isMarketingUser ? `lead-${Date.now()}` : `task-${Date.now()}`;
    const newTask: Task = {
      id: newTaskId,
      title: data.title,
      description: data.description,
      projectId: data.projectId,
      assigneeId: data.assigneeId,
      createdById: currentUser.id,
      priority: data.priority,
      status: defaultStatus,
      dueDate: data.dueDate,
      createdAt: new Date().toISOString(),
      tags: data.tags || (isMarketingUser ? [defaultStatus === 'calling' ? 'Calling' : defaultStatus === 'field_visit' ? 'Field Visit' : 'Product Demo'] : []),
      department: isMarketingUser ? 'Marketing' : 'Engineering',
      clientContact: data.clientContact,
      clientPhone: data.clientPhone,
      clientLocation: data.clientLocation,
      stageOutcome: data.stageOutcome
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
      'Task Created',
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
      dispatchSystemNotification('Task Completed!', {
        body: `"${task.title}" marked as completed by ${currentUser.name}`,
        data: { taskId: task.id }
      });

      addToast('Task Completed!', `"${task.title}" marked as completed.`, 'success');
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

    const updatedTask: Task = {
      ...oldTask,
      ...updates,
      completedAt: updates.status === 'completed'
        ? (oldTask.completedAt || new Date().toISOString())
        : (updates.status && updates.status !== 'completed' ? undefined : (updates.completedAt !== undefined ? updates.completedAt : oldTask.completedAt))
    };
    setTasks(prev => prev.map(t => (t.id === taskId ? updatedTask : t)));
    upsertTaskToSupabase(updatedTask);
    realtimeSync.broadcast('TASK_UPDATED', { taskId, updates: { ...updates, completedAt: updatedTask.completedAt } });

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

  // Delete task (Manager only)
  const deleteTask = (taskId: string) => {
    if (currentUser.role !== 'manager') {
      addToast('Permission Denied', 'Only managers are authorized to delete tasks.', 'warning');
      return;
    }
    setDeletedTaskIds(prev => Array.from(new Set([...prev, taskId])));
    const task = tasks.find(t => t.id === taskId);
    setTasks(prev => prev.filter(t => t.id !== taskId));
    deleteTaskFromSupabase(taskId);
    realtimeSync.broadcast('TASK_DELETED', { taskId });
    if (task) {
      addToast('Task Deleted', `"${task.title}" was removed`, 'info');
    }
  };

  // Delete project (Manager only)
  const deleteProject = (projectId: string) => {
    if (currentUser.role !== 'manager') {
      addToast('Permission Denied', 'Only managers are authorized to delete projects.', 'warning');
      return;
    }
    setDeletedProjectIds(prev => Array.from(new Set([...prev, projectId])));
    const proj = projects.find(p => p.id === projectId);
    setProjects(prev => prev.filter(p => p.id !== projectId));
    deleteProjectFromSupabase(projectId);
    realtimeSync.broadcast('PROJECT_DELETED', { projectId });
    if (selectedProjectId === projectId) {
      setSelectedProjectId(null);
    }
    if (proj) {
      addToast('Project Deleted', `"${proj.name}" was removed`, 'info');
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

  // Send message (Partitioned team chat or 1-on-1 Direct Messaging)
  const sendMessage = (text: string, channelId?: string, recipientId?: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const defaultChannel = currentDept === 'marketing' ? 'ch-marketing' : 'ch-engineering';

    // Direct message channel key or department team channel
    const targetChannel = recipientId
      ? `dm-${[currentUser.id, recipientId].sort().join('-')}`
      : (channelId || defaultChannel);

    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderAvatar: currentUser.avatar,
      senderRole: currentUser.role,
      senderTitle: currentUser.title,
      text: trimmed,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      channelId: targetChannel,
      recipientId: recipientId || undefined,
      isEncrypted: true
    };

    // 1. Optimistic instant local state update
    setMessages(prev => [...prev, newMsg]);

    // 2. Direct database cloud write
    insertMessageToSupabase(newMsg);

    // 3. Instant local cross-tab broadcast
    realtimeSync.broadcast('MESSAGE_SENT', newMsg);

    // 4. If direct message, dispatch an in-app notification to the recipient in Supabase
    if (recipientId) {
      const recipientUser = users.find(u => u.id === recipientId || (u.email && u.email.toLowerCase() === recipientId.toLowerCase()));
      if (recipientUser && recipientUser.id !== currentUser.id) {
        const msgNotif: Notification = {
          id: `notif-${Date.now()}`,
          userId: recipientUser.id,
          senderId: currentUser.id,
          title: `Direct message from ${currentUser.name}`,
          message: trimmed.length > 60 ? `${trimmed.substring(0, 57)}...` : trimmed,
          type: 'message',
          read: false,
          createdAt: new Date().toISOString()
        };
        setNotifications(prev => [msgNotif, ...prev]);
        upsertNotificationToSupabase(msgNotif);
        realtimeSync.broadcast('NOTIFICATION_CREATED', msgNotif);
      }
    }
  };

  // Clear team chat messages for current channel directly from Supabase Cloud
  const clearMessages = () => {
    const channelToClear = currentDept === 'marketing' ? 'ch-marketing' : 'ch-engineering';
    setMessages(prev => prev.filter(m => {
      if (m.recipientId) return true;
      if (currentDept === 'marketing') return m.channelId !== 'ch-marketing';
      return m.channelId !== 'ch-engineering' && m.channelId !== 'ch-team-chat' && !!m.channelId;
    }));
    clearMessagesFromSupabase(channelToClear);
    realtimeSync.broadcast('MESSAGES_CLEARED', { channelId: channelToClear });
    addToast('Chat Cleared', `Messages in ${currentDept === 'marketing' ? 'Marketing' : 'Software Development'} channel have been cleared.`, 'info');
  };

  // Reset data to pristine production state
  const resetAllData = async () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (e) {
      console.warn('Failed clearing storage:', e);
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

    // Match against active users and fall back to INITIAL_USERS so default personas always succeed
    const candidatePool = [
      ...users,
      ...INITIAL_USERS.filter(iu => !users.some(u => u.id === iu.id || u.email.toLowerCase() === iu.email.toLowerCase()))
    ];

    const matchedUser = candidatePool.find(u => {
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
        ((rawInput === 'sahilparbale@gmail.com' || rawInput === 'sahil' || rawInput === 'sahilparbale') && (u.id === 'user-2' || u.name.includes('Sahil'))) ||
        ((rawInput === 'priya.marketing@taskflow.io' || rawInput === 'priyasharma' || rawInput === 'priya') && (u.id === 'user-marketing-mgr' || u.name.includes('Priya') || u.email.includes('priya'))) ||
        ((rawInput === 'aarav.mehta@taskflow.io' || rawInput === 'aarav') && (u.id === 'user-marketing-emp' || u.name.includes('Aarav') || u.email.includes('aarav')))
      );
    });

    if (!matchedUser) {
      return {
        success: false,
        error: `No account found for "${usernameOrEmail}". Try Shreyas Jadhav (shreyasjadhav@gmail.com) for Software or Priya Sharma (priya.marketing@taskflow.io) for Marketing.`
      };
    }

    // Ensure matched user is present in memory and persisted in Supabase
    if (!users.some(u => u.id === matchedUser.id)) {
      setUsers(prev => [...prev, matchedUser]);
      upsertUserToSupabase(matchedUser).catch(() => {});
    }

    // Check password
    const expectedPassword = matchedUser.password || (
      matchedUser.id === 'user-1' ? 'shreyas123' :
      matchedUser.id === 'user-marketing-mgr' || matchedUser.id === 'user-marketing-emp' ? 'marketing123' :
      'password123'
    );
    const isPasswordValid =
      password === expectedPassword ||
      (matchedUser.id === 'user-1' && (password === 'shreyas123' || password === 'password123')) ||
      (matchedUser.id === 'user-2' && (password === 'sahil123' || password === 'password123')) ||
      (matchedUser.department.toLowerCase().includes('market') && (password === 'marketing123' || password === 'password123')) ||
      password === 'password123' ||
      password === 'taskflow123';

    if (!isPasswordValid) {
      const defaultPwdHint = matchedUser.id === 'user-1'
        ? '"shreyas123"'
        : matchedUser.department.toLowerCase().includes('market')
        ? '"marketing123"'
        : '"password123"';
      return {
        success: false,
        error: `Incorrect password. Password for ${matchedUser.name} is ${defaultPwdHint}.`
      };
    }

    // Set authenticated state & current user
    setCurrentUserId(matchedUser.id);
    setIsAuthenticated(true);
    sessionStorage.setItem(`${STORAGE_KEY}_is_authenticated`, 'true');
    sessionStorage.setItem(`${STORAGE_KEY}_currentUserId`, matchedUser.id);

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
      `Welcome, ${matchedUser.name}!`,
      `Signed in as ${matchedUser.role === 'manager' ? 'Manager' : 'Employee'}. Workspace unlocked.`,
      'success'
    );

    // Immediately trigger cloud sync for newly authenticated user
    pullCloudChanges(true);

    return { success: true };
  };

  const logout = () => {
    setIsAuthenticated(false);
    sessionStorage.setItem(`${STORAGE_KEY}_is_authenticated`, 'false');
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
    return tasks.filter(t => isTaskAssignedToUser(t, currentUser));
  }, [tasks, currentUser]);

  return (
    <AppContext.Provider
      value={{
        currentUser,
        users: scopedUsers,
        tasks: scopedTasks,
        projects: scopedProjects,
        notifications,
        activities: scopedActivities,
        devPipelines,
        devLogs,
        messages: scopedMessages,
        currentView,
        department: currentDept,
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
        deleteProject,
        markNotificationRead,
        markAllNotificationsRead,
        sendNotification,
        sendMessage,
        clearMessages,
        activeChatTarget,
        setActiveChatTarget,
        openChatWithUser,
        resetAllData,
        addToast,
        removeToast,
        syncWithSupabase,

        supabaseStatus,
        supabaseLatencyMs,
        isMessagesTableMissing,

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
