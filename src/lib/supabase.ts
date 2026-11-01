import { Project, Task, User, ActivityLog, Notification, ChatMessage, PresenceStatus } from '../types';
import { encryptTextMessage, decryptTextMessage } from './encryption';

const envUrl = (import.meta.env.VITE_SUPABASE_URL as string) || '';
const envKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || '';

// Active verified project is xdwkcybxgqdtnpnypxfj
export const SUPABASE_URL =
  envUrl && !envUrl.includes('kgkggknznzumdhujsilj')
    ? envUrl
    : 'https://xdwkcybxgqdtnpnypxfj.supabase.co';

export const SUPABASE_ANON_KEY =
  envKey && !envKey.includes('kgkggknznzumdhujsilj') && !SUPABASE_URL.includes('xdwkcybxgqdtnpnypxfj')
    ? envKey
    : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhkd2tjeWJ4Z3FkdG5wbnlweGZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM0OTY3NDksImV4cCI6MjEwOTA3Mjc0OX0.e596Uej5lQi3QmRmwZIu7bV-Cw165Awo0vQSwqAjA2g';

export type SupabaseStatus = 'connected' | 'connecting' | 'needs_migration' | 'disconnected';

const getHeaders = (extra: Record<string, string> = {}) => ({
  'apikey': SUPABASE_ANON_KEY,
  'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=representation',
  ...extra
});

export const MESSAGES_TABLE_SQL = `-- Run this in your Supabase Dashboard -> SQL Editor:
CREATE TABLE IF NOT EXISTS public.messages (
  id TEXT PRIMARY KEY,
  sender_id TEXT NOT NULL,
  sender_name TEXT,
  sender_avatar TEXT,
  sender_role TEXT,
  sender_title TEXT,
  text TEXT NOT NULL,
  timestamp TEXT,
  channel_id TEXT NOT NULL DEFAULT 'ch-team-chat',
  recipient_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anon all on messages" ON public.messages;
CREATE POLICY "Allow anon all on messages" ON public.messages FOR ALL USING (true) WITH CHECK (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
`;

// Check Supabase connection and verify if the tables exist
export async function checkSupabaseHealth(): Promise<{ status: SupabaseStatus; latencyMs: number; message: string; isMessagesMissing?: boolean }> {
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
      let isMessagesMissing = false;
      try {
        const msgRes = await fetch(`${SUPABASE_URL}/rest/v1/messages?select=id&limit=1`, {
          method: 'GET',
          headers: getHeaders()
        });
        if (msgRes.status === 404) {
          isMessagesMissing = true;
        }
      } catch {}

      return {
        status: 'connected',
        latencyMs,
        isMessagesMissing,
        message: isMessagesMissing
          ? 'Connected to Supabase, but "messages" table is missing'
          : 'Supabase Cloud Connected'
      };
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
    return data.map((row: any): Project => {
      const isMarketingProj =
        row.id === 'proj-mkt-1' ||
        String(row.id).includes('mkt') ||
        row.key === 'MKT' ||
        (row.name && (row.name.toLowerCase().includes('marketing') || row.name.toLowerCase().includes('campaign') || row.name.toLowerCase().includes('product') || row.name.toLowerCase().includes('crm') || row.name.toLowerCase().includes('launch'))) ||
        (row.department && row.department.toLowerCase().includes('market'));

      return {
        id: row.id,
        name: row.name,
        key: row.key,
        description: row.description || '',
        health: row.health || 'on_track',
        deadline: row.deadline || '',
        members: Array.isArray(row.members) ? row.members : (typeof row.members === 'string' ? JSON.parse(row.members) : []),
        progress: Number(row.progress) || 0,
        department: isMarketingProj ? 'Marketing' : (row.department || 'Engineering'),
        lastUpdatedBy: row.last_updated_by,
        lastUpdatedAt: row.last_updated_at
      };
    });
  } catch (e) {
    console.warn('[Supabase] fetchProjects error:', e);
    return null;
  }
}

export async function upsertProjectToSupabase(project: Project): Promise<boolean> {
  try {
    const isMkt =
      project.id === 'proj-mkt-1' ||
      project.id.includes('mkt') ||
      project.key === 'MKT' ||
      (project.department && project.department.toLowerCase().includes('market'));

    const dept = isMkt ? 'Marketing' : (project.department || 'Engineering');

    const payload: any = {
      id: project.id,
      name: project.name,
      key: project.key,
      description: project.description,
      health: project.health,
      deadline: project.deadline,
      members: project.members,
      progress: project.progress,
      department: dept,
      last_updated_by: project.lastUpdatedBy,
      last_updated_at: project.lastUpdatedAt
    };

    let res = await fetch(`${SUPABASE_URL}/rest/v1/projects`, {
      method: 'POST',
      headers: getHeaders({ 'Prefer': 'resolution=merge-duplicates,return=representation' }),
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      // Fallback: Strip custom columns if not yet migrated in Supabase
      const { department, last_updated_by, last_updated_at, ...fallbackPayload } = payload;
      res = await fetch(`${SUPABASE_URL}/rest/v1/projects`, {
        method: 'POST',
        headers: getHeaders({ 'Prefer': 'resolution=merge-duplicates,return=representation' }),
        body: JSON.stringify(fallbackPayload)
      });
    }

    return res.ok;
  } catch (e) {
    console.warn('[Supabase] upsertProject error:', e);
    return false;
  }
}

export async function deleteProjectFromSupabase(projectId: string): Promise<boolean> {
  try {
    // 1. Clear project_id from tasks referencing this project so foreign keys don't block deletion
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/tasks?project_id=eq.${encodeURIComponent(projectId)}`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ project_id: null })
      });
    } catch {
      // ignore
    }

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
    return data.map((row: any): Task => {
      const tags = Array.isArray(row.tags) ? row.tags : (typeof row.tags === 'string' ? JSON.parse(row.tags || '[]') : []);

      const hasMarketingTag = tags.some((tg: string) => {
        if (typeof tg !== 'string') return false;
        const low = tg.toLowerCase();
        return (
          low.includes('calling') ||
          low.includes('field visit') ||
          low.includes('demo') ||
          low.includes('lead') ||
          low.includes('client') ||
          low.includes('closed won') ||
          low.startsWith('stage:')
        );
      });

      // Comprehensive marketing detection across all signals
      const isMkt =
        (row.id && (String(row.id).startsWith('lead-') || String(row.id).includes('mkt'))) ||
        ['calling', 'field_visit', 'demo'].includes(row.status) ||
        !!row.client_contact ||
        !!row.client_location ||
        !!row.client_phone ||
        row.assignee_id === 'user-marketing-emp' ||
        (row.assignee_id && (row.assignee_id.toLowerCase().includes('aarav') || row.assignee_id.toLowerCase().includes('marketing'))) ||
        row.created_by_id === 'user-marketing-mgr' ||
        (row.created_by_id && (row.created_by_id.toLowerCase().includes('priya') || row.created_by_id.toLowerCase().includes('marketing'))) ||
        (row.department && row.department.toLowerCase().includes('market')) ||
        hasMarketingTag;

      // If DB status is completed or completed_at is set, the task is permanently completed in the database!
      let resolvedStatus: TaskStatus = row.status || (isMkt ? 'calling' : 'todo');
      if (row.status === 'completed' || row.completed_at) {
        resolvedStatus = 'completed';
      } else {
        const stageTag = tags.find((tg: string) => typeof tg === 'string' && tg.startsWith('stage:'));
        if (stageTag) {
          resolvedStatus = stageTag.slice('stage:'.length) as TaskStatus;
        }
      }

      // Extract client details from metadata tags if row columns are null
      const contactTag = tags.find((tg: string) => typeof tg === 'string' && tg.startsWith('mkt_contact:'));
      const phoneTag = tags.find((tg: string) => typeof tg === 'string' && tg.startsWith('mkt_phone:'));
      const locTag = tags.find((tg: string) => typeof tg === 'string' && tg.startsWith('mkt_loc:'));
      const outcomeTag = tags.find((tg: string) => typeof tg === 'string' && tg.startsWith('mkt_outcome:'));

      const resolvedContact = row.client_contact || (contactTag ? contactTag.slice('mkt_contact:'.length) : undefined);
      const resolvedPhone = row.client_phone || (phoneTag ? phoneTag.slice('mkt_phone:'.length) : undefined);
      const resolvedLocation = row.client_location || (locTag ? locTag.slice('mkt_loc:'.length) : undefined);
      const resolvedOutcome = row.stage_outcome || (outcomeTag ? outcomeTag.slice('mkt_outcome:'.length) : undefined);

      // Clean presentation tags (strip internal metadata tags so badges remain clean)
      const cleanTags = tags.filter(
        (tg: string) =>
          typeof tg === 'string' &&
          !tg.startsWith('stage:') &&
          !tg.startsWith('mkt_contact:') &&
          !tg.startsWith('mkt_phone:') &&
          !tg.startsWith('mkt_loc:') &&
          !tg.startsWith('mkt_outcome:')
      );

      return {
        id: row.id,
        title: row.title,
        description: row.description || '',
        projectId: row.project_id || undefined,
        assigneeId: row.assignee_id,
        createdById: row.created_by_id,
        priority: row.priority || 'medium',
        status: resolvedStatus,
        dueDate: row.due_date,
        tags: cleanTags,
        createdAt: row.created_at,
        completedAt: row.completed_at || undefined,
        estimatedHours: row.estimated_hours ? Number(row.estimated_hours) : undefined,
        department: isMkt ? 'Marketing' : (row.department || 'Engineering'),
        clientContact: resolvedContact,
        clientPhone: resolvedPhone,
        clientLocation: resolvedLocation,
        stageOutcome: resolvedOutcome
      };
    });
  } catch (e) {
    console.warn('[Supabase] fetchTasks error:', e);
    return null;
  }
}

export async function upsertTaskToSupabase(task: Task): Promise<boolean> {
  try {
    const isMkt =
      task.id.startsWith('lead-') ||
      task.id.includes('mkt') ||
      ['calling', 'field_visit', 'demo'].includes(task.status) ||
      task.assigneeId === 'user-marketing-emp' ||
      task.assigneeId.toLowerCase().includes('aarav') ||
      task.assigneeId.toLowerCase().includes('marketing') ||
      task.createdById === 'user-marketing-mgr' ||
      task.createdById.toLowerCase().includes('priya') ||
      task.createdById.toLowerCase().includes('marketing') ||
      (task.department && task.department.toLowerCase().includes('market'));

    const dept = isMkt ? 'Marketing' : (task.department || 'Engineering');

    // Strip prior internal metadata tags from base tags
    const cleanBaseTags = (task.tags || []).filter(
      (tg: string) =>
        typeof tg === 'string' &&
        !tg.startsWith('stage:') &&
        !tg.startsWith('mkt_contact:') &&
        !tg.startsWith('mkt_phone:') &&
        !tg.startsWith('mkt_loc:') &&
        !tg.startsWith('mkt_outcome:')
    );

    // Dual-layer metadata encoding: Store client contact person, phone, location, outcome,
    // and stage directly in tags array. This guarantees that even if Supabase table columns
    // have not been migrated or are stripped on HTTP 400, every single piece of client information
    // is permanently preserved and safely persisted in PostgreSQL!
    const enrichedTags = Array.from(new Set([
      ...cleanBaseTags,
      isMkt ? `stage:${task.status}` : null,
      task.clientContact ? `mkt_contact:${task.clientContact}` : null,
      task.clientPhone ? `mkt_phone:${task.clientPhone}` : null,
      task.clientLocation ? `mkt_loc:${task.clientLocation}` : null,
      task.stageOutcome ? `mkt_outcome:${task.stageOutcome}` : null
    ])).filter(Boolean) as string[];

    const payload: any = {
      id: task.id,
      title: task.title,
      description: task.description,
      project_id: task.projectId || null,
      assignee_id: task.assigneeId,
      created_by_id: task.createdById,
      priority: task.priority,
      status: task.status,
      due_date: task.dueDate,
      tags: enrichedTags,
      estimated_hours: task.estimatedHours || null,
      completed_at: task.completedAt || null,
      department: dept,
      client_contact: task.clientContact || null,
      client_phone: task.clientPhone || null,
      client_location: task.clientLocation || null,
      stage_outcome: task.stageOutcome || null
    };

    let res = await fetch(`${SUPABASE_URL}/rest/v1/tasks`, {
      method: 'POST',
      headers: getHeaders({ 'Prefer': 'resolution=merge-duplicates,return=representation' }),
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      // Fallback 1: Strip client custom columns if not yet present in Supabase table
      // Note: tags (with enriched metadata) is retained so no client data is lost!
      const { client_contact, client_phone, client_location, stage_outcome, ...basicPayload } = payload;
      res = await fetch(`${SUPABASE_URL}/rest/v1/tasks`, {
        method: 'POST',
        headers: getHeaders({ 'Prefer': 'resolution=merge-duplicates,return=representation' }),
        body: JSON.stringify(basicPayload)
      });

      if (!res.ok) {
        // Fallback 2: Map status to valid constraint status 'in_progress' and drop department if rejected
        const { department, ...fallbackPayload } = basicPayload;
        const safeStatus = task.status === 'completed' ? 'completed' : 'in_progress';
        res = await fetch(`${SUPABASE_URL}/rest/v1/tasks`, {
          method: 'POST',
          headers: getHeaders({ 'Prefer': 'resolution=merge-duplicates,return=representation' }),
          body: JSON.stringify({
            ...fallbackPayload,
            status: safeStatus
          })
        });

        if (!res.ok) {
          // Fallback 3: Drop project_id in case project foreign key fails
          res = await fetch(`${SUPABASE_URL}/rest/v1/tasks`, {
            method: 'POST',
            headers: getHeaders({ 'Prefer': 'resolution=merge-duplicates,return=representation' }),
            body: JSON.stringify({
              ...fallbackPayload,
              project_id: null,
              status: safeStatus
            })
          });
        }
      }
    }

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
    return data.map((row: any): User => {
      const isMarketingUser =
        row.id === 'user-marketing-mgr' ||
        row.id === 'user-marketing-emp' ||
        (row.email && (row.email.includes('marketing') || row.email.includes('aarav') || row.email.includes('priya'))) ||
        (row.name && (row.name.includes('Priya') || row.name.includes('Aarav'))) ||
        (row.title && (row.title.toLowerCase().includes('marketing') || row.title.toLowerCase().includes('growth'))) ||
        (row.department && row.department.toLowerCase().includes('market'));

      return {
        id: row.id,
        name: row.name,
        email: row.email,
        username: row.username || (row.email ? row.email.split('@')[0] : row.id),
        password: row.password || 'password123',
        role: row.role || 'employee',
        avatar: row.avatar || '',
        title: row.title || '',
        department: isMarketingUser ? 'Marketing' : (row.department || 'Engineering'),
        presence: (row.presence as PresenceStatus) || 'online',
        bio: row.bio || '',
        phone: row.phone || undefined
      };
    });
  } catch (e) {
    console.warn('[Supabase] fetchUsers error:', e);
    return null;
  }
}

export async function upsertUserToSupabase(user: User): Promise<boolean> {
  try {
    const isMarketingUser =
      user.id === 'user-marketing-mgr' ||
      user.id === 'user-marketing-emp' ||
      user.email.includes('marketing') ||
      user.email.includes('aarav') ||
      user.email.includes('priya') ||
      user.name.includes('Priya') ||
      user.name.includes('Aarav') ||
      (user.department && user.department.toLowerCase().includes('market'));

    const dept = isMarketingUser ? 'Marketing' : (user.department || 'Engineering');

    const payload = {
      id: user.id,
      name: user.name,
      email: user.email,
      username: user.username || (user.email ? user.email.split('@')[0] : user.id),
      password: user.password || 'password123',
      role: user.role,
      avatar: user.avatar,
      title: user.title,
      department: dept,
      presence: user.presence,
      bio: user.bio,
      phone: user.phone || null
    };

    let res = await fetch(`${SUPABASE_URL}/rest/v1/users`, {
      method: 'POST',
      headers: getHeaders({ 'Prefer': 'resolution=merge-duplicates,return=representation' }),
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      // Fallback: Strip optional columns if not in users table schema
      const { username, password, department, phone, bio, ...basicUserPayload } = payload;
      res = await fetch(`${SUPABASE_URL}/rest/v1/users`, {
        method: 'POST',
        headers: getHeaders({ 'Prefer': 'resolution=merge-duplicates,return=representation' }),
        body: JSON.stringify(basicUserPayload)
      });
    }

    return res.ok;
  } catch (e) {
    console.warn('[Supabase] upsertUser error:', e);
    return false;
  }
}

export async function deleteUserFromSupabase(userId: string, email?: string): Promise<boolean> {
  try {
    // 1. Reassign any tasks assigned to this user to department manager so foreign keys/references don't block deletion
    const isMarketingUser =
      userId.includes('mkt') ||
      userId === 'user-marketing-emp' ||
      (email && (email.includes('market') || email.includes('aarav') || email.includes('priya')));
    const fallbackManagerId = isMarketingUser ? 'user-marketing-mgr' : 'user-1';

    try {
      await fetch(`${SUPABASE_URL}/rest/v1/tasks?assignee_id=eq.${encodeURIComponent(userId)}`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ assignee_id: fallbackManagerId })
      });
    } catch {
      // ignore
    }

    // 2. Delete user by id
    const resId = await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${encodeURIComponent(userId)}`, {
      method: 'DELETE',
      headers: getHeaders()
    });

    // 3. Delete by email if available to guarantee complete database cleanup
    if (email) {
      await fetch(`${SUPABASE_URL}/rest/v1/users?email=eq.${encodeURIComponent(email)}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
    }

    return resId.ok;
  } catch (e) {
    console.warn('[Supabase] deleteUser error:', e);
    return false;
  }
}

// Purge any legacy demo employees from Supabase so only active roster remains
export async function purgeLegacySeedUsersFromSupabase(): Promise<void> {
  const legacyEmails = [
    'alex.morgan@company.com',
    'david.chen@company.com',
    'elena.rostova@company.com',
    'marcus.vance@company.com'
  ];
  for (const email of legacyEmails) {
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/users?email=eq.${encodeURIComponent(email)}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
    } catch {
      // ignore
    }
  }
}

// Ensure default users for both Software and Marketing teams exist in Supabase
export async function ensureDefaultUsersInSupabase(): Promise<void> {
  const defaultUsers: User[] = [
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

  for (const u of defaultUsers) {
    await upsertUserToSupabase(u);
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
    return await Promise.all(
      data.map(async (row: any): Promise<ChatMessage> => {
        const conversationId = row.recipient_id
          ? `dm-${[row.sender_id, row.recipient_id].sort().join('-')}`
          : (row.channel_id || 'ch-team-chat');

        const { text: decryptedText, isEncrypted } = await decryptTextMessage(row.text, conversationId);

        return {
          id: row.id,
          senderId: row.sender_id,
          senderName: row.sender_name,
          senderAvatar: row.sender_avatar,
          senderRole: row.sender_role,
          senderTitle: row.sender_title,
          text: decryptedText,
          timestamp: row.timestamp || new Date(row.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          channelId: row.channel_id,
          recipientId: row.recipient_id || undefined,
          isEncrypted: isEncrypted || (row.text && row.text.startsWith('enc:v1:'))
        };
      })
    );
  } catch (e) {
    console.warn('[Supabase] fetchMessages error:', e);
    return null;
  }
}

export async function insertMessageToSupabase(msg: ChatMessage): Promise<boolean> {
  try {
    const conversationId = msg.recipientId
      ? `dm-${[msg.senderId, msg.recipientId].sort().join('-')}`
      : (msg.channelId || 'ch-team-chat');

    const cipherText = await encryptTextMessage(msg.text, conversationId);

    const payload = {
      id: msg.id,
      sender_id: msg.senderId,
      sender_name: msg.senderName,
      sender_avatar: msg.senderAvatar,
      sender_role: msg.senderRole,
      sender_title: msg.senderTitle,
      text: cipherText,
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
export async function clearMessagesFromSupabase(channelId?: string): Promise<boolean> {
  try {
    const filter = channelId
      ? `channel_id=eq.${encodeURIComponent(channelId)}`
      : 'id=neq.placeholder_none';
    const res = await fetch(`${SUPABASE_URL}/rest/v1/messages?${filter}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return res.ok;
  } catch (e) {
    console.warn('[Supabase] clearMessages error:', e);
    return false;
  }
}

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
      }),
      fetch(`${SUPABASE_URL}/rest/v1/messages?id=neq.placeholder_none`, {
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

