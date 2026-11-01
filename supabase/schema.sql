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

-- 3. Tasks & Deliverables Table (Supports both Engineering Deliverables & Marketing Field Operations)
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
  client_contact TEXT,
  client_phone TEXT,
  client_location TEXT,
  stage_outcome TEXT,
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
-- Migration Helpers for Existing Deployments: Add department column & marketing stages
-- ============================================================================
ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_status_check;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS department TEXT DEFAULT 'Engineering';
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS department TEXT DEFAULT 'Engineering';
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS department TEXT DEFAULT 'Engineering';
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS client_contact TEXT;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS client_phone TEXT;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS client_location TEXT;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS stage_outcome TEXT;

-- ============================================================================
-- Performance Indexes for Ultra-Fast Queries
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_tasks_assignee_id ON public.tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON public.tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_department ON public.tasks(department);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON public.tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_projects_department ON public.projects(department);
CREATE INDEX IF NOT EXISTS idx_messages_channel_id ON public.messages(channel_id);

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

-- ============================================================================
-- Seed Initial Projects (Software Development & Marketing Campaigns)
-- ============================================================================
INSERT INTO public.projects (id, name, key, description, health, deadline, members, progress, department, last_updated_by, last_updated_at)
VALUES
  ('proj-eng-1', 'Platform Core Sprint', 'DEV', 'Real-time task synchronization, end-to-end encryption, and CI/CD automation.', 'on_track', '2026-12-15', '["user-1", "user-2"]'::jsonb, 65, 'Engineering', 'Shreyas Jadhav', 'Just now'),
  ('proj-mkt-1', 'Q4 Product Launch Campaign', 'MKT', 'Digital brand awareness, SEO positioning, newsletter launches, and client outreach.', 'on_track', '2026-12-31', '["user-marketing-mgr", "user-marketing-emp"]'::jsonb, 40, 'Marketing', 'Priya Sharma', 'Just now')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  key = EXCLUDED.key,
  description = EXCLUDED.description,
  department = EXCLUDED.department;

-- ============================================================================
-- Seed Marketing Client Engagements / Field Leads
-- ============================================================================
INSERT INTO public.tasks (id, title, description, project_id, assignee_id, created_by_id, priority, status, due_date, tags, department, client_contact, client_phone, client_location, stage_outcome)
VALUES
  ('lead-mkt-1', 'Zenith Logistics & Supply', 'Introductory qualification call to understand fleet management requirements.', 'proj-mkt-1', 'user-marketing-emp', 'user-marketing-mgr', 'high', 'calling', '2026-11-03', '["Calling", "Inbound Lead"]'::jsonb, 'Marketing', 'Sunil Nair (Director)', '+91 98210 11223', 'Andheri East, Mumbai', NULL),
  ('lead-mkt-2', 'Apex Healthcare Network', 'On-site corporate visit to inspect hospital facility and meet clinical admin team.', 'proj-mkt-1', 'user-marketing-emp', 'user-marketing-mgr', 'urgent', 'field_visit', '2026-11-04', '["Field Visit", "Enterprise"]'::jsonb, 'Marketing', 'Dr. Rajesh Iyer', '+91 98330 44556', 'BKC Complex, Mumbai', NULL),
  ('lead-mkt-3', 'Reliance Retail Franchise', 'Live solution demonstration scheduled with procurement department.', 'proj-mkt-1', 'user-marketing-emp', 'user-marketing-mgr', 'high', 'demo', '2026-11-06', '["Product Demo", "Corporate"]'::jsonb, 'Marketing', 'Pooja Deshmukh (Procurement Lead)', '+91 98700 77889', 'Navi Mumbai Hub', NULL),
  ('lead-mkt-4', 'Metropolis Diagnostic Labs', 'Contract finalized. 50 user licenses approved following on-site demo.', 'proj-mkt-1', 'user-marketing-emp', 'user-marketing-mgr', 'medium', 'completed', '2026-11-01', '["Closed Won", "Signed Contract"]'::jsonb, 'Marketing', 'Vikram Malhotra', '+91 98190 33445', 'Worli, Mumbai', 'Signed annual contract for 50 enterprise seats.')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  client_contact = EXCLUDED.client_contact,
  client_phone = EXCLUDED.client_phone,
  client_location = EXCLUDED.client_location,
  stage_outcome = EXCLUDED.stage_outcome,
  status = EXCLUDED.status,
  department = EXCLUDED.department;
