import { Project, Task, User, ActivityLog, Notification, ChatMessage, PresenceStatus } from '../types';

const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL as string) || 'https://kgkggknznzumdhujsilj.supabase.co';
const SUPABASE_ANON_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || '';

export type SupabaseStatus = 'connected' | 'connecting' | 'needs_migration' | 'disconnected';

const getHeaders = (extra: Record<string, string> = {}) => ({
  'apikey': SUPABASE_ANON_KEY,
  'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=representation',
  ...extra
});

// Check Supabase connection and verify if the tables exist
export async function checkSupabaseHealth(): Promise<{ status: SupabaseStatus; latencyMs: number; message: string }> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return { status: 'disconnected', latencyMs: 0, message: 'Missing Supabase URL or Anon Key' };
  }

  const start = performance.now();
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/projects?select=id&limit=1`, {
      method: 'GET',
      headers: getHeaders()
    });
    const latencyMs = Math.round(performance.now() - start);

    if (res.ok) {
      return { status: 'connected', latencyMs, message: 'Supabase Cloud Connected' };
    }

    // 404 or relation does not exist
    const text = await res.text();
    if (res.status === 404 || text.includes('relation') || text.includes('does not exist')) {
      return {
        status: 'needs_migration',
        latencyMs,
        message: 'Connected to Supabase, but database tables need to be created via SQL Editor.'
      };
    }

    return { status: 'disconnected', latencyMs, message: `Supabase returned ${res.status}: ${res.statusText}` };
  } catch (err: any) {
    const latencyMs = Math.round(performance.now() - start);
    return { status: 'disconnected', latencyMs, message: err?.message || 'Network error reaching Supabase' };
  }
}

// ==========================================
// Projects API
// ==========================================
export async function fetchProjectsFromSupabase(): Promise<Project[] | null> {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/projects?select=*&order=created_at.desc`, {
      headers: getHeaders()
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.map((row: any): Project => ({
      id: row.id,
      name: row.name,
      key: row.key,
      description: row.description || '',
      health: row.health || 'on_track',
      deadline: row.deadline || '',
      members: Array.isArray(row.members) ? row.members : (typeof row.members === 'string' ? JSON.parse(row.members) : []),
      progress: Number(row.progress) || 0,
      lastUpdatedBy: row.last_updated_by,
      lastUpdatedAt: row.last_updated_at
    }));
  } catch (e) {
    console.warn('[Supabase] fetchProjects error:', e);
    return null;
  }
}

export async function upsertProjectToSupabase(project: Project): Promise<boolean> {
  try {
    const payload = {
      id: project.id,
      name: project.name,
      key: project.key,
      description: project.description,
      health: project.health,
      deadline: project.deadline,
      members: project.members,
      progress: project.progress,
      last_updated_by: project.lastUpdatedBy,
      last_updated_at: project.lastUpdatedAt
    };

    const res = await fetch(`${SUPABASE_URL}/rest/v1/projects`, {
      method: 'POST',
      headers: getHeaders({ 'Prefer': 'resolution=merge-duplicates,return=representation' }),
      body: JSON.stringify(payload)
    });
    return res.ok;
  } catch (e) {
    console.warn('[Supabase] upsertProject error:', e);
    return false;
  }
}

export async function deleteProjectFromSupabase(projectId: string): Promise<boolean> {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/projects?id=eq.${encodeURIComponent(projectId)}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return res.ok;
  } catch (e) {
    console.warn('[Supabase] deleteProject error:', e);
    return false;
  }
}

// ==========================================
// Tasks API
// ==========================================
export async function fetchTasksFromSupabase(): Promise<Task[] | null> {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/tasks?select=*&order=created_at.desc`, {
      headers: getHeaders()
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.map((row: any): Task => ({
      id: row.id,
      title: row.title,
      description: row.description || '',
      projectId: row.project_id || undefined,
      assigneeId: row.assignee_id,
      createdById: row.created_by_id,
      priority: row.priority || 'medium',
      status: row.status || 'todo',
      dueDate: row.due_date,
      tags: Array.isArray(row.tags) ? row.tags : (typeof row.tags === 'string' ? JSON.parse(row.tags) : []),
      createdAt: row.created_at,
      completedAt: row.completed_at || undefined,
      estimatedHours: row.estimated_hours ? Number(row.estimated_hours) : undefined
    }));
  } catch (e) {
    console.warn('[Supabase] fetchTasks error:', e);
    return null;
  }
}

export async function upsertTaskToSupabase(task: Task): Promise<boolean> {
  try {
    const payload = {
      id: task.id,
      title: task.title,
      description: task.description,
      project_id: task.projectId || null,
      assignee_id: task.assigneeId,
      created_by_id: task.createdById,
      priority: task.priority,
      status: task.status,
      due_date: task.dueDate,
      tags: task.tags || [],
      estimated_hours: task.estimatedHours || null,
      completed_at: task.completedAt || null
    };

    const res = await fetch(`${SUPABASE_URL}/rest/v1/tasks`, {
      method: 'POST',
      headers: getHeaders({ 'Prefer': 'resolution=merge-duplicates,return=representation' }),
      body: JSON.stringify(payload)
    });
    return res.ok;
  } catch (e) {
    console.warn('[Supabase] upsertTask error:', e);
    return false;
  }
}

export async function deleteTaskFromSupabase(taskId: string): Promise<boolean> {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/tasks?id=eq.${encodeURIComponent(taskId)}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return res.ok;
  } catch (e) {
    console.warn('[Supabase] deleteTask error:', e);
    return false;
  }
}

// ==========================================
// Users API
// ==========================================
export async function fetchUsersFromSupabase(): Promise<User[] | null> {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/users?select=*&order=created_at.asc`, {
      headers: getHeaders()
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.map((row: any): User => ({
      id: row.id,
      name: row.name,
      email: row.email,
      username: row.username || (row.email ? row.email.split('@')[0] : row.id),
      password: row.password || 'password123',
      role: row.role || 'employee',
      avatar: row.avatar || '',
      title: row.title || '',
      department: row.department || '',
      presence: (row.presence as PresenceStatus) || 'online',
      bio: row.bio || '',
      phone: row.phone || undefined
    }));
  } catch (e) {
    console.warn('[Supabase] fetchUsers error:', e);
    return null;
  }
}

export async function upsertUserToSupabase(user: User): Promise<boolean> {
  try {
    const payload = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      title: user.title,
      department: user.department,
      presence: user.presence,
      bio: user.bio,
      phone: user.phone || null
    };

    const res = await fetch(`${SUPABASE_URL}/rest/v1/users`, {
      method: 'POST',
      headers: getHeaders({ 'Prefer': 'resolution=merge-duplicates,return=representation' }),
      body: JSON.stringify(payload)
    });
    return res.ok;
  } catch (e) {
    console.warn('[Supabase] upsertUser error:', e);
    return false;
  }
}

export async function deleteUserFromSupabase(userId: string): Promise<boolean> {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${encodeURIComponent(userId)}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return res.ok;
  } catch (e) {
    console.warn('[Supabase] deleteUser error:', e);
    return false;
  }
}

// ==========================================
// Activities API
// ==========================================
export async function fetchActivitiesFromSupabase(): Promise<ActivityLog[] | null> {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/activity_logs?select=*&order=created_at.desc&limit=30`, {
      headers: getHeaders()
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.map((row: any): ActivityLog => ({
      id: row.id,
      userId: row.user_id,
      action: row.action,
      target: row.target,
      timestamp: row.timestamp || 'Just now',
      type: row.type || 'task'
    }));
  } catch (e) {
    console.warn('[Supabase] fetchActivities error:', e);
    return null;
  }
}

export async function insertActivityToSupabase(act: ActivityLog): Promise<boolean> {
  try {
    const payload = {
      id: act.id,
      user_id: act.userId,
      action: act.action,
      target: act.target,
      timestamp: act.timestamp,
      type: act.type
    };

    const res = await fetch(`${SUPABASE_URL}/rest/v1/activity_logs`, {
      method: 'POST',
      headers: getHeaders({ 'Prefer': 'resolution=ignore-duplicates,return=representation' }),
      body: JSON.stringify(payload)
    });
    return res.ok;
  } catch (e) {
    console.warn('[Supabase] insertActivity error:', e);
    return false;
  }
}

// ==========================================
// Notifications API
// ==========================================
export async function fetchNotificationsFromSupabase(userId?: string): Promise<Notification[] | null> {
  try {
    const query = userId ? `?user_id=eq.${encodeURIComponent(userId)}&order=created_at.desc` : '?order=created_at.desc';
    const res = await fetch(`${SUPABASE_URL}/rest/v1/notifications${query}`, {
      headers: getHeaders()
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.map((row: any): Notification => ({
      id: row.id,
      userId: row.user_id,
      senderId: row.sender_id,
      title: row.title,
      message: row.message,
      type: row.type || 'system',
      read: Boolean(row.read),
      taskId: row.task_id,
      projectId: row.project_id,
      createdAt: row.created_at
    }));
  } catch (e) {
    console.warn('[Supabase] fetchNotifications error:', e);
    return null;
  }
}

export async function upsertNotificationToSupabase(notif: Notification): Promise<boolean> {
  try {
    const payload = {
      id: notif.id,
      user_id: notif.userId,
      sender_id: notif.senderId || null,
      title: notif.title,
      message: notif.message,
      type: notif.type,
      read: notif.read,
      task_id: notif.taskId || null,
      project_id: notif.projectId || null,
      created_at: notif.createdAt
    };

    const res = await fetch(`${SUPABASE_URL}/rest/v1/notifications`, {
      method: 'POST',
      headers: getHeaders({ 'Prefer': 'resolution=merge-duplicates,return=representation' }),
      body: JSON.stringify(payload)
    });
    return res.ok;
  } catch (e) {
    console.warn('[Supabase] upsertNotification error:', e);
    return false;
  }
}

// ==========================================
// Messages API
// ==========================================
export async function fetchMessagesFromSupabase(): Promise<ChatMessage[] | null> {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/messages?select=*&order=created_at.asc`, {
      headers: getHeaders()
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.map((row: any): ChatMessage => ({
      id: row.id,
      senderId: row.sender_id,
      senderName: row.sender_name,
      senderAvatar: row.sender_avatar,
      senderRole: row.sender_role,
      senderTitle: row.sender_title,
      text: row.text,
      timestamp: row.timestamp || new Date(row.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      channelId: row.channel_id,
      recipientId: row.recipient_id || undefined
    }));
  } catch (e) {
    console.warn('[Supabase] fetchMessages error:', e);
    return null;
  }
}

export async function insertMessageToSupabase(msg: ChatMessage): Promise<boolean> {
  try {
    const payload = {
      id: msg.id,
      sender_id: msg.senderId,
      sender_name: msg.senderName,
      sender_avatar: msg.senderAvatar,
      sender_role: msg.senderRole,
      sender_title: msg.senderTitle,
      text: msg.text,
      timestamp: msg.timestamp,
      channel_id: msg.channelId || 'ch-team-chat',
      recipient_id: msg.recipientId || null
    };

    const res = await fetch(`${SUPABASE_URL}/rest/v1/messages`, {
      method: 'POST',
      headers: getHeaders({ 'Prefer': 'resolution=merge-duplicates,return=representation' }),
      body: JSON.stringify(payload)
    });
    return res.ok;
  } catch (e) {
    console.warn('[Supabase] insertMessage error:', e);
    return false;
  }
}

// ==========================================
// Clear all data from Supabase Cloud
// ==========================================
export async function clearAllCloudDataFromSupabase(): Promise<boolean> {
  try {
    await Promise.all([
      fetch(`${SUPABASE_URL}/rest/v1/tasks?id=neq.placeholder_none`, {
        method: 'DELETE',
        headers: getHeaders()
      }),
      fetch(`${SUPABASE_URL}/rest/v1/projects?id=neq.placeholder_none`, {
        method: 'DELETE',
        headers: getHeaders()
      }),
      fetch(`${SUPABASE_URL}/rest/v1/activity_logs?id=neq.placeholder_none`, {
        method: 'DELETE',
        headers: getHeaders()
      }),
      fetch(`${SUPABASE_URL}/rest/v1/notifications?id=neq.placeholder_none`, {
        method: 'DELETE',
        headers: getHeaders()
      })
    ]);
    return true;
  } catch (e) {
    console.warn('[Supabase] clearAllCloudData error:', e);
    return false;
  }
}

