-- Create user_roles table for role-based access control
-- Migration: 002_create_user_roles_table.sql
-- Description: Creates user_roles table that the auth system depends on

-- Table: user_roles (assigns roles to users)
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('parent', 'instructor', 'admin', 'vmrc_coordinator')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Create indexes for performance
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_role ON public.user_roles(role);

-- Enable Row Level Security
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create updated_at trigger
CREATE TRIGGER update_user_roles_updated_at
  BEFORE UPDATE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert a default admin user if needed (optional)
-- Replace 'your-admin-user-id' with actual admin user ID
-- INSERT INTO public.user_roles (user_id, role)
-- VALUES ('your-admin-user-id', 'admin')
-- ON CONFLICT (user_id, role) DO NOTHING;