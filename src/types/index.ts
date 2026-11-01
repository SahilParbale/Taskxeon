export type Role = 'manager' | 'employee';

export type PresenceStatus = 'online' | 'break' | 'offline';

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export type TaskStatus = 
  | 'todo' 
  | 'in_progress' 
  | 'blocked' 
  | 'completed'
  | 'calling'
  | 'field_visit'
  | 'demo';

export type ProjectHealth = 'on_track' | 'at_risk' | 'behind';

export type NotificationType = 'assignment' | 'completion' | 'reassignment' | 'overdue' | 'system' | 'message';

export interface User {
  id: string;
  name: string;
  email: string;
  username?: string;
  password?: string;
  role: Role;
  avatar: string;
  title: string;
  department: string;
  presence: PresenceStatus;
  bio?: string;
  phone?: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  projectId?: string; // Optional reference, tasks are independent
  assigneeId: string;
  createdById: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: string; // ISO date string YYYY-MM-DD (Scheduled visit/call date)
  createdAt: string;
  completedAt?: string;
  tags?: string[];
  estimatedHours?: number;
  department?: string;
  // Field Operations & Client Engagement Metadata:
  clientContact?: string;
  clientPhone?: string;
  clientLocation?: string;
  stageOutcome?: string;
}

export interface Project {
  id: string;
  name: string;
  key: string;
  description: string;
  health: ProjectHealth;
  deadline: string;
  members: string[]; // User IDs
  progress: number; // 0 - 100, manually updated by employees and managers
  lastUpdatedBy?: string;
  lastUpdatedAt?: string;
  department?: string;
}

export interface Notification {
  id: string;
  userId: string; // recipient
  senderId?: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  createdAt: string;
  taskId?: string;
  projectId?: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  action: string;
  target: string;
  timestamp: string;
  type: 'task' | 'project' | 'status' | 'presence' | 'system';
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName?: string;
  senderAvatar?: string;
  senderRole?: 'manager' | 'employee' | string;
  senderTitle?: string;
  text: string;
  timestamp: string;
  channelId?: string;
  recipientId?: string;
  isEncrypted?: boolean;
}

export interface DevPipeline {
  id: string;
  name: string;
  branch: string;
  commit: string;
  commitMsg: string;
  author: string;
  status: 'success' | 'running' | 'failed';
  duration: string;
  timestamp: string;
}

export interface DevLog {
  id: string;
  level: 'info' | 'warn' | 'error' | 'success';
  service: string;
  message: string;
  timestamp: string;
}

export type ViewType = 
  | 'dashboard' 
  | 'tasks' 
  | 'projects' 
  | 'project_detail' 
  | 'team' 
  | 'messages';

export interface EmployeePresenceTiming {
  date: string; // YYYY-MM-DD
  userId: string;
  onlineMinutes: number;
  breakMinutes: number;
  offlineMinutes: number;
  onlineSeconds?: number;
  breakSeconds?: number;
  offlineSeconds?: number;
  lastUpdated?: string;
}
