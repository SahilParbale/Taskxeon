import { User, Project, Task, Notification, ActivityLog, ChatMessage, DevPipeline, DevLog, EmployeePresenceTiming } from '../types';

export const INITIAL_USERS: User[] = [
  {
    id: 'user-1',
    name: 'Shreyas Jadhav',
    email: 'shreyasjadhav@gmail.com',
    username: 'shreyasjadhav',
    password: 'shreyas123',
    role: 'manager',
    title: 'Head of Software Development',
    department: 'Engineering',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    presence: 'online',
    bio: 'Oversees software engineering, sprint allocation, and technical deliverables.'
  },
  {
    id: 'user-marketing-mgr',
    name: 'Hemant Patil',
    email: 'hemantpatil@gmail.com',
    username: 'hemantpatil',
    password: 'hemant123',
    role: 'manager',
    title: 'Head of Marketing & Growth',
    department: 'Marketing',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    presence: 'online',
    bio: 'Oversees digital marketing, client acquisition, and growth strategy.'
  }
];

export const INITIAL_PROJECTS: Project[] = [];

export const INITIAL_TASKS: Task[] = [];

export const INITIAL_NOTIFICATIONS: Notification[] = [];

export const INITIAL_ACTIVITIES: ActivityLog[] = [];

export const INITIAL_DEV_PIPELINES: DevPipeline[] = [
  {
    id: 'pipe-1',
    name: 'GitHub Actions Continuous Integration (CI)',
    branch: 'main',
    commit: '3c65556',
    commitMsg: 'Taskxeon: Automated typecheck, build verification & artifact generation',
    author: 'SahilParbale',
    status: 'success',
    duration: '42s',
    timestamp: 'Just now'
  },
  {
    id: 'pipe-2',
    name: 'Realtime Multi-Client Continuous Sync (CD)',
    branch: 'main',
    commit: 'realtime-live',
    commitMsg: 'Simultaneous cross-tab BroadcastChannel & Supabase Cloud live sync',
    author: 'TaskFlow Engine',
    status: 'running',
    duration: 'Live (3s Heartbeat)',
    timestamp: 'Continuous'
  },
  {
    id: 'pipe-3',
    name: 'Employee Presence & Task Telemetry Service',
    branch: 'main',
    commit: 'telemetry-stream',
    commitMsg: 'Live broadcast of employee status [online, break, offline] & instant notifications',
    author: 'Presence Daemon',
    status: 'success',
    duration: '< 5ms broadcast',
    timestamp: 'Active'
  }
];

export const INITIAL_DEV_LOGS: DevLog[] = [
  {
    id: 'log-1',
    timestamp: '10:30:15',
    level: 'success',
    service: 'github-actions',
    message: 'CI/CD pipeline .github/workflows/ci-cd.yml executed successfully on main branch.'
  },
  {
    id: 'log-2',
    timestamp: '10:30:18',
    level: 'info',
    service: 'realtime-sync',
    message: 'BroadcastChannel "taskflow_realtime_channel_v1" registered for 0ms cross-tab propagation.'
  },
  {
    id: 'log-3',
    timestamp: '10:30:20',
    level: 'info',
    service: 'cloud-polling',
    message: 'Supabase Cloud heartbeat active (3000ms interval). Synchronizing tasks and live presence.'
  },
  {
    id: 'log-4',
    timestamp: '10:30:22',
    level: 'success',
    service: 'presence-service',
    message: 'Employee presence telemetry connected. Status transitions [online, break, offline] broadcast instantly.'
  },
  {
    id: 'log-5',
    timestamp: '10:30:25',
    level: 'info',
    service: 'task-dispatcher',
    message: 'Manager task assignments mapped directly to employee logins with native system ring notifications.'
  }
];

export const INITIAL_CHANNELS = [
  { id: 'ch-engineering', name: 'Software Development Team', description: 'Universal engineering collaboration thread' },
  { id: 'ch-marketing', name: 'Marketing Team', description: 'Universal marketing and growth campaign thread' },
  { id: 'ch-team-chat', name: 'Team Chat', description: 'Legacy team collaboration thread' }
];

export const INITIAL_MESSAGES: ChatMessage[] = [];

export const INITIAL_PRESENCE_TIMINGS: Record<string, Record<string, EmployeePresenceTiming>> = {};
