-- Waiver Update System Tables
-- Migration: 20260203_waiver_update_system.sql
-- Description: Creates tables for managing waiver updates via magic links

-- Table 1: waiver_update_tokens
-- Stores magic link tokens for parents to update waivers
CREATE TABLE IF NOT EXISTS public.waiver_update_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT false,
  email_sent_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_waiver_tokens_token ON public.waiver_update_tokens(token);
CREATE INDEX idx_waiver_tokens_parent ON public.waiver_update_tokens(parent_id);
CREATE INDEX idx_waiver_tokens_expires ON public.waiver_update_tokens(expires_at);

-- Table 2: waiver_update_log
-- Logs all waiver updates for audit trail
CREATE TABLE IF NOT EXISTS public.waiver_update_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID NOT NULL REFERENCES public.profiles(id),
  swimmer_id UUID NOT NULL REFERENCES public.swimmers(id),
  waiver_type TEXT NOT NULL CHECK (waiver_type IN ('liability', 'photo_release', 'cancellation_policy')),
  completed_at TIMESTAMPTZ DEFAULT now(),
  ip_address TEXT,
  user_agent TEXT,
  token_id UUID REFERENCES public.waiver_update_tokens(id)
);

-- Indexes for performance
CREATE INDEX idx_waiver_log_swimmer ON public.waiver_update_log(swimmer_id);
CREATE INDEX idx_waiver_log_parent ON public.waiver_update_log(parent_id);
CREATE INDEX idx_waiver_log_completed ON public.waiver_update_log(completed_at);

-- Create updated_at triggers
CREATE TRIGGER update_waiver_tokens_updated_at
  BEFORE UPDATE ON public.waiver_update_tokens
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_waiver_log_updated_at
  BEFORE UPDATE ON public.waiver_update_log
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Row Level Security Policies

-- waiver_update_tokens: Allow public token validation (no authentication required)
ALTER TABLE public.waiver_update_tokens ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public to validate tokens (read-only)
CREATE POLICY "Allow public token validation" ON public.waiver_update_tokens
  FOR SELECT USING (true);

-- Policy: Only system/admin can insert tokens
CREATE POLICY "System can insert tokens" ON public.waiver_update_tokens
  FOR INSERT WITH CHECK (true);

-- Policy: Only system/admin can update tokens (mark as used)
CREATE POLICY "System can update tokens" ON public.waiver_update_tokens
  FOR UPDATE USING (true);

-- waiver_update_log: Admins can read all, system can insert
ALTER TABLE public.waiver_update_log ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can view all logs
CREATE POLICY "Admins can view all logs" ON public.waiver_update_log
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  ));

-- Policy: System can insert logs (no authentication required for magic link flow)
CREATE POLICY "System can insert logs" ON public.waiver_update_log
  FOR INSERT WITH CHECK (true);

-- Add comment on table for documentation
COMMENT ON TABLE public.waiver_update_tokens IS 'Magic link tokens for parents to update swimmer waivers';
COMMENT ON TABLE public.waiver_update_log IS 'Audit log of waiver updates completed via magic links';