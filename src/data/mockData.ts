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
    id: 'user-2',
    name: 'Sahil Parbale',
    email: 'sahilparbale@gmail.com',
    username: 'sahil',
    password: 'password123',
    role: 'employee',
    title: 'Lead Full-Stack Engineer',
    department: 'Engineering',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    presence: 'online',
    bio: 'Core engineering lead driving TaskFlow features, CI/CD, and system architecture.'
  },
  {
    id: 'user-marketing-mgr',
    name: 'Priya Sharma',
    email: 'priya.marketing@taskflow.io',
    username: 'priyasharma',
    password: 'marketing123',
    role: 'manager',
    title: 'Head of Marketing & Growth',
    department: 'Marketing',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    presence: 'online',
    bio: 'Leads digital marketing, brand campaigns, SEO strategy, and customer acquisition.'
  },
  {
    id: 'user-marketing-emp',
    name: 'Aarav Mehta',
    email: 'aarav.mehta@taskflow.io',
    username: 'aarav',
    password: 'marketing123',
    role: 'employee',
    title: 'Growth & Content Specialist',
    department: 'Marketing',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    presence: 'online',
    bio: 'Executes organic social media, content production, paid search campaigns, and conversion copy.'
  }
];

export const INITIAL_PROJECTS: Project[] = [
  {
    id: 'proj-eng-1',
    name: 'Platform Core Sprint',
    key: 'DEV',
    description: 'Real-time task synchronization, end-to-end encryption, and CI/CD automation.',
    health: 'on_track',
    deadline: '2026-12-15',
    members: ['user-1', 'user-2'],
    progress: 65,
    department: 'Engineering',
    lastUpdatedBy: 'Shreyas Jadhav',
    lastUpdatedAt: 'Just now'
  },
  {
    id: 'proj-mkt-1',
    name: 'Q4 Product Launch Campaign',
    key: 'MKT',
    description: 'Digital brand awareness, SEO positioning, newsletter launches, and ad creatives.',
    health: 'on_track',
    deadline: '2026-12-31',
    members: ['user-marketing-mgr', 'user-marketing-emp'],
    progress: 40,
    department: 'Marketing',
    lastUpdatedBy: 'Priya Sharma',
    lastUpdatedAt: 'Just now'
  }
];

export const INITIAL_TASKS: Task[] = [
  {
    id: 'task-eng-1',
    title: 'Implement AES-256 E2EE Channel Security',
    description: 'Ensure all chat messages and DM channels use authenticated WebCrypto AES-GCM encryption.',
    projectId: 'proj-eng-1',
    assigneeId: 'user-2',
    createdById: 'user-1',
    priority: 'high',
    status: 'in_progress',
    dueDate: '2026-11-10',
    createdAt: new Date().toISOString(),
    tags: ['Security', 'API', 'WebCrypto'],
    department: 'Engineering'
  },
  {
    id: 'task-mkt-1',
    title: 'Draft Brand Launch Creatives & Copy',
    description: 'Prepare high-converting copy and social media graphics for the Q4 product release.',
    projectId: 'proj-mkt-1',
    assigneeId: 'user-marketing-emp',
    createdById: 'user-marketing-mgr',
    priority: 'high',
    status: 'in_progress',
    dueDate: '2026-11-12',
    createdAt: new Date().toISOString(),
    tags: ['Campaign', 'Content', 'Social Media'],
    department: 'Marketing'
  }
];

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
