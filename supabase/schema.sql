-- ============================================================================
-- TaskFlow Enterprise Supabase Database Schema
-- Project: xdwkcybxgqdtnpnypxfj
-- ============================================================================

-- 1. Users / Employees Table
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'employee',
  avatar TEXT,
  title TEXT,
  department TEXT,
  presence TEXT NOT NULL DEFAULT 'online',
  bio TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Projects Table
CREATE TABLE IF NOT EXISTS public.projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  key TEXT NOT NULL UNIQUE,
  description TEXT,
  health TEXT NOT NULL DEFAULT 'on_track',
  deadline TEXT,
  members JSONB NOT NULL DEFAULT '[]'::jsonb,
  progress INTEGER NOT NULL DEFAULT 0,
  department TEXT DEFAULT 'Engineering',
  last_updated_by TEXT,
  last_updated_at TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tasks & Deliverables Table
CREATE TABLE IF NOT EXISTS public.tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  project_id TEXT,
  assignee_id TEXT NOT NULL,
  created_by_id TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'todo',
  due_date TEXT NOT NULL,
  tags JSONB DEFAULT '[]'::jsonb,
  estimated_hours NUMERIC,
  department TEXT DEFAULT 'Engineering',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- 4. Activity Logs Table
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  action TEXT NOT NULL,
  target TEXT NOT NULL,
  timestamp TEXT,
  type TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  sender_id TEXT,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'system',
  read BOOLEAN NOT NULL DEFAULT FALSE,
  task_id TEXT,
  project_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Team Chat & Direct Messages Table
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

-- ============================================================================
-- Enable Row Level Security (RLS) & Grant Policies for Anon Access
-- ============================================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Allow full read & write access for authenticated anon client
DROP POLICY IF EXISTS "Allow anon all on users" ON public.users;
CREATE POLICY "Allow anon all on users" ON public.users FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon all on projects" ON public.projects;
CREATE POLICY "Allow anon all on projects" ON public.projects FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon all on tasks" ON public.tasks;
CREATE POLICY "Allow anon all on tasks" ON public.tasks FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon all on activity_logs" ON public.activity_logs;
CREATE POLICY "Allow anon all on activity_logs" ON public.activity_logs FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon all on notifications" ON public.notifications;
CREATE POLICY "Allow anon all on notifications" ON public.notifications FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon all on messages" ON public.messages;
CREATE POLICY "Allow anon all on messages" ON public.messages FOR ALL USING (true) WITH CHECK (true);

-- Enable Supabase Realtime for live cross-tab updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.users;
ALTER PUBLICATION supabase_realtime ADD TABLE public.projects;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- ============================================================================
-- Migration Helpers for Existing Deployments: Add department column
-- ============================================================================
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS department TEXT DEFAULT 'Engineering';
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS department TEXT DEFAULT 'Engineering';

-- ============================================================================
-- Seed Initial Users (Software Development & Marketing Personas)
-- ============================================================================
INSERT INTO public.users (id, name, email, role, avatar, title, department, presence, bio, phone)
VALUES
  ('user-1', 'Shreyas Jadhav', 'shreyasjadhav@gmail.com', 'manager', 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80', 'Head of Software Development', 'Engineering', 'online', 'Oversees software engineering, sprint allocation, and technical deliverables.', '+1 (555) 234-5678'),
  ('user-2', 'Sahil Parbale', 'sahilparbale@gmail.com', 'employee', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80', 'Lead Full-Stack Engineer', 'Engineering', 'online', 'Core engineering lead driving TaskFlow features, CI/CD, and system architecture.', '+1 (555) 345-6789'),
  ('user-marketing-mgr', 'Priya Sharma', 'priya.marketing@taskflow.io', 'manager', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80', 'Head of Marketing & Growth', 'Marketing', 'online', 'Leads digital marketing, brand campaigns, SEO strategy, and customer acquisition.', '+1 (555) 456-7890'),
  ('user-marketing-emp', 'Aarav Mehta', 'aarav.mehta@taskflow.io', 'employee', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80', 'Growth & Content Specialist', 'Marketing', 'online', 'Executes organic social media, content production, paid search campaigns, and conversion copy.', '+1 (555) 567-8901')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  role = EXCLUDED.role,
  title = EXCLUDED.title,
  department = EXCLUDED.department;
