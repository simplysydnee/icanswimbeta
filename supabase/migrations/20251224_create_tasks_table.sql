-- Migration: Create tasks table for Kanban system
-- Description: Creates tasks table with RLS policies for task management

-- Create tasks table
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'completed', 'needs_attention')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  category TEXT DEFAULT 'other' CHECK (category IN ('swimmer_related', 'business_operations', 'follow_up', 'other')),
  due_date DATE,
  assigned_to UUID REFERENCES auth.users(id),
  swimmer_id UUID REFERENCES public.swimmers(id),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON public.tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_created_by ON public.tasks(created_by);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON public.tasks(due_date);

-- Enable Row Level Security
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Policy: Users see tasks assigned to them, created by them, or all if owner (sutton@icanswim209.com)
CREATE POLICY "Task visibility" ON public.tasks
  FOR ALL USING (
    assigned_to = auth.uid()
    OR created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM auth.users u
      WHERE u.id = auth.uid() AND u.email = 'sutton@icanswim209.com'
    )
  );

-- Policy: Users can insert tasks (they will be created_by them)
CREATE POLICY "Task creation" ON public.tasks
  FOR INSERT WITH CHECK (
    created_by = auth.uid()
  );

-- Policy: Users can update tasks assigned to them or created by them, or all if owner
CREATE POLICY "Task updates" ON public.tasks
  FOR UPDATE USING (
    assigned_to = auth.uid()
    OR created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM auth.users u
      WHERE u.id = auth.uid() AND u.email = 'sutton@icanswim209.com'
    )
  );

-- Policy: Users can delete tasks they created, or all if owner
CREATE POLICY "Task deletion" ON public.tasks
  FOR DELETE USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM auth.users u
      WHERE u.id = auth.uid() AND u.email = 'sutton@icanswim209.com'
    )
  );

-- Trigger for updated_at and completed_at
CREATE OR REPLACE FUNCTION update_tasks_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    NEW.completed_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION update_tasks_timestamp();

-- Add comment explaining the table
COMMENT ON TABLE public.tasks IS 'Task management system for admins and instructors with Kanban workflow';