-- ============================================================================
-- TaskFlow Enterprise Supabase Database Schema
-- Project: kgkggknznzumdhujsilj
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
-- Seed Initial Demo Data (Only inserts if not already present)
-- ============================================================================

-- Insert Users
INSERT INTO public.users (id, name, email, role, avatar, title, department, presence, bio, phone)
VALUES
  ('user-1', 'Shreyas Jadhav', 'shreyasjadhav@gmail.com', 'manager', 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80', 'Engineering Director', 'Engineering', 'online', 'Leading engineering team operations and architectural scaling.', '+1 (555) 234-5678'),
  ('user-2', 'Alex Morgan', 'alex.morgan@company.com', 'employee', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80', 'Senior Full Stack Engineer', 'Core Product', 'online', 'TypeScript, React, Node.js systems architect.', '+1 (555) 345-6789'),
  ('user-3', 'David Chen', 'david.chen@company.com', 'employee', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80', 'DevOps & Cloud Lead', 'Infrastructure', 'break', 'Kubernetes, multi-region AWS architectures and CI/CD pipelines.', '+1 (555) 456-7890'),
  ('user-4', 'Elena Rostova', 'elena.rostova@company.com', 'employee', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80', 'Product Designer', 'Design & UX', 'online', 'Design systems, accessibility, and micro-interactions.', '+1 (555) 567-8901'),
  ('user-5', 'Marcus Vance', 'marcus.vance@company.com', 'employee', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80', 'Security & QA Engineer', 'Security', 'offline', 'Automated testing suites and vulnerability assessments.', '+1 (555) 678-9012')
ON CONFLICT (id) DO NOTHING;

-- Insert Projects
INSERT INTO public.projects (id, name, key, description, health, deadline, members, progress, last_updated_by, last_updated_at)
VALUES
  ('proj-1', 'TaskFlow Web 2.0', 'TF', 'Complete frontend rebuild using React, TypeScript, and modern component architecture.', 'on_track', '2026-11-15', '["user-1", "user-2", "user-4"]'::jsonb, 72, 'Alex Morgan', 'Today at 10:15 AM'),
  ('proj-2', 'Enterprise Security Audit', 'SEC', 'SOC2 Type II remediation, RBAC permission matrices, audit logging, and third-party penetration response.', 'at_risk', '2026-10-25', '["user-1", "user-2", "user-3", "user-5"]'::jsonb, 45, 'Shreyas Jadhav', 'Yesterday at 3:30 PM'),
  ('proj-3', 'Cloud Infrastructure v2', 'INF', 'Multi-region AWS EKS rollout, Terraform IAC templates, and automated Redis cluster sharding for zero-downtime scaling.', 'on_track', '2026-12-05', '["user-1", "user-3"]'::jsonb, 88, 'David Chen', '2 days ago'),
  ('proj-4', 'Customer Billing Migration', 'FIN', 'Transition enterprise tier invoicing from legacy system to unified Stripe Billing API with automated tax recalculation.', 'on_track', '2026-11-28', '["user-1", "user-4"]'::jsonb, 60, 'Elena Rostova', '3 days ago')
ON CONFLICT (id) DO NOTHING;

-- Insert Initial Tasks
INSERT INTO public.tasks (id, title, description, project_id, assignee_id, created_by_id, priority, status, due_date, tags)
VALUES
  ('task-101', 'Design high-fidelity design system tokens', 'Create standardized Tailwind semantic color variables, typography scales, and button interactive states for web and tablet.', 'proj-1', 'user-2', 'user-1', 'high', 'in_progress', '2026-10-24', '["Design System", "UI/UX"]'::jsonb),
  ('task-102', 'Review Q3 Security Audit Spec and RBAC Matrix', 'Verify role-based access control restrictions for manager vs employee roles and produce a signed compliance signoff document.', 'proj-2', 'user-2', 'user-1', 'urgent', 'todo', '2026-10-22', '["Security", "Compliance"]'::jsonb),
  ('task-103', 'Deploy multi-region AWS EKS cluster', 'Configure Terraform manifests for us-east-1 and eu-west-1 with automated latency failover routing via Route53.', 'proj-3', 'user-3', 'user-1', 'high', 'completed', '2026-10-20', '["DevOps", "Kubernetes"]'::jsonb),
  ('task-104', 'Configure Redis cluster failover automated testing', 'Simulate leader pod termination in staging cluster and ensure node failover takes place under 400 milliseconds.', 'proj-3', 'user-3', 'user-1', 'urgent', 'blocked', '2026-10-23', '["Infrastructure", "Redis"]'::jsonb),
  ('task-105', 'Update Stripe Billing webhooks and tax calculation', 'Implement resilient webhook handler for invoice.paid and customer.subscription.updated with idempotent event IDs.', 'proj-4', 'user-4', 'user-1', 'medium', 'in_progress', '2026-10-25', '["FinTech", "Stripe"]'::jsonb),
  ('task-106', 'Implement user presence telemetry and heartbeat', 'Maintain employee live availability states (online, break, offline) with automatic timeout transitions after 15 min.', 'proj-1', 'user-2', 'user-1', 'high', 'in_progress', '2026-10-22', '["Architecture", "WebSockets"]'::jsonb),
  ('task-107', 'Refactor navigation layout and responsive drawer', 'Consolidate sidebar navigation links, badge counters, and optimize mobile drawer touch swipe gestures.', 'proj-1', 'user-4', 'user-1', 'low', 'completed', '2026-10-19', '["Frontend", "Mobile"]'::jsonb),
  ('task-108', 'Conduct automated penetration test suite', 'Run OWASP ZAP automated scanner against staging endpoints and prepare vulnerability triage matrix.', 'proj-2', 'user-5', 'user-1', 'urgent', 'todo', '2026-10-24', '["Security", "QA"]'::jsonb)
ON CONFLICT (id) DO NOTHING;
