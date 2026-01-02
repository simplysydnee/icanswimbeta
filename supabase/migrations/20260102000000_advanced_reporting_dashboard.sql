-- Migration: Advanced Reporting Dashboard
-- Description: Adds enhanced tracking columns and creates reporting functions for instructor performance and coordinator billing

-- Step 1: Add enhanced tracking columns to purchase_orders table
ALTER TABLE public.purchase_orders
ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS escalated_at TIMESTAMPTZ;

-- Add comment for documentation
COMMENT ON COLUMN public.purchase_orders.submitted_at IS 'When the PO was submitted to coordinator';
COMMENT ON COLUMN public.purchase_orders.approved_at IS 'When the PO was approved by coordinator';
COMMENT ON COLUMN public.purchase_orders.reminder_sent_at IS 'When a reminder was sent to coordinator';
COMMENT ON COLUMN public.purchase_orders.escalated_at IS 'When the PO was escalated to supervisor';

-- Step 2: Create escalation history table
CREATE TABLE IF NOT EXISTS public.coordinator_escalations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coordinator_email TEXT NOT NULL,
  coordinator_name TEXT,
  reason TEXT NOT NULL,
  notes TEXT,
  escalated_by UUID REFERENCES public.profiles(id),
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_coordinator_escalations_email ON public.coordinator_escalations(coordinator_email);
CREATE INDEX IF NOT EXISTS idx_coordinator_escalations_resolved ON public.coordinator_escalations(resolved);
CREATE INDEX IF NOT EXISTS idx_coordinator_escalations_created_at ON public.coordinator_escalations(created_at);

-- Step 3: Create function to calculate instructor booking velocity
CREATE OR REPLACE FUNCTION public.get_instructor_booking_velocity(
  start_date TIMESTAMPTZ DEFAULT NOW() - INTERVAL '30 days',
  end_date TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TABLE (
  instructor_id UUID,
  instructor_name TEXT,
  total_bookings INTEGER,
  avg_days_to_book NUMERIC,
  open_sessions INTEGER,
  available_spots INTEGER,
  total_cancellations INTEGER,
  late_cancellations INTEGER,
  total_sessions_taught INTEGER,
  total_unique_swimmers INTEGER
) AS $$
BEGIN
  RETURN QUERY
  WITH instructor_stats AS (
    SELECT
      p.id AS instructor_id,
      p.full_name AS instructor_name,
      -- Booking velocity
      COUNT(b.id) AS total_bookings,
      AVG(EXTRACT(EPOCH FROM (b.created_at - s.created_at)) / 86400) AS avg_days_to_book,
      -- Open slots
      COUNT(CASE WHEN s.status IN ('available', 'open') AND s.start_time > NOW() THEN s.id END) AS open_sessions,
      SUM(CASE WHEN s.status IN ('available', 'open') AND s.start_time > NOW() THEN s.max_capacity - s.booking_count ELSE 0 END) AS available_spots,
      -- Cancellations
      COUNT(CASE WHEN b.status = 'cancelled' THEN b.id END) AS total_cancellations,
      COUNT(CASE WHEN b.status = 'cancelled' AND b.canceled_at > s.start_time - INTERVAL '24 hours' THEN b.id END) AS late_cancellations,
      -- Overall stats
      COUNT(DISTINCT s.id) AS total_sessions_taught,
      COUNT(DISTINCT b.swimmer_id) AS total_unique_swimmers
    FROM profiles p
    LEFT JOIN sessions s ON s.instructor_id = p.id
    LEFT JOIN bookings b ON b.session_id = s.id
    WHERE p.role = 'instructor'
      AND s.start_time BETWEEN start_date AND end_date
    GROUP BY p.id, p.full_name
  )
  SELECT * FROM instructor_stats
  ORDER BY avg_days_to_book NULLS LAST;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Create function to get coordinator POS authorization time
CREATE OR REPLACE FUNCTION public.get_coordinator_authorization_metrics(
  start_date TIMESTAMPTZ DEFAULT NOW() - INTERVAL '90 days',
  end_date TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TABLE (
  coordinator_name TEXT,
  coordinator_email TEXT,
  total_pos INTEGER,
  avg_days_to_approve NUMERIC,
  pending_count INTEGER,
  approved_count INTEGER,
  expired_count INTEGER,
  overdue_pos INTEGER,
  swimmer_count INTEGER,
  avg_response_days NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH coordinator_stats AS (
    SELECT
      sw.vmrc_coordinator_name AS coordinator_name,
      sw.vmrc_coordinator_email AS coordinator_email,
      COUNT(po.id) AS total_pos,
      AVG(EXTRACT(EPOCH FROM (po.approved_at - po.submitted_at)) / 86400) AS avg_days_to_approve,
      COUNT(CASE WHEN po.status = 'pending' THEN 1 END) AS pending_count,
      COUNT(CASE WHEN po.status = 'approved' THEN 1 END) AS approved_count,
      COUNT(CASE WHEN po.status = 'expired' THEN 1 END) AS expired_count,
      COUNT(CASE WHEN po.status = 'pending' AND po.submitted_at < NOW() - INTERVAL '14 days' THEN 1 END) AS overdue_pos,
      COUNT(DISTINCT sw.id) AS swimmer_count,
      AVG(EXTRACT(EPOCH FROM (COALESCE(po.approved_at, NOW()) - po.submitted_at)) / 86400) AS avg_response_days
    FROM swimmers sw
    LEFT JOIN purchase_orders po ON po.swimmer_id = sw.id
    WHERE sw.is_vmrc_client = true
      AND sw.vmrc_coordinator_name IS NOT NULL
      AND (po.submitted_at BETWEEN start_date AND end_date OR po.submitted_at IS NULL)
    GROUP BY sw.vmrc_coordinator_name, sw.vmrc_coordinator_email
  )
  SELECT * FROM coordinator_stats
  ORDER BY overdue_pos DESC, avg_response_days DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Create function to get top 5 problem coordinators
CREATE OR REPLACE FUNCTION public.get_top_problem_coordinators()
RETURNS TABLE (
  coordinator_name TEXT,
  coordinator_email TEXT,
  swimmer_count INTEGER,
  overdue_pos INTEGER,
  avg_response_days NUMERIC,
  total_pending INTEGER,
  total_overdue_balance_cents BIGINT
) AS $$
BEGIN
  RETURN QUERY
  WITH problem_coordinators AS (
    SELECT
      sw.vmrc_coordinator_name AS coordinator_name,
      sw.vmrc_coordinator_email AS coordinator_email,
      COUNT(DISTINCT sw.id) AS swimmer_count,
      COUNT(CASE WHEN po.status = 'pending' AND po.submitted_at < NOW() - INTERVAL '14 days' THEN 1 END) AS overdue_pos,
      AVG(EXTRACT(EPOCH FROM (COALESCE(po.approved_at, NOW()) - po.submitted_at)) / 86400) AS avg_response_days,
      COUNT(CASE WHEN po.status = 'pending' THEN 1 END) AS total_pending,
      SUM(CASE
        WHEN po.billing_status = 'overdue' THEN po.billed_amount_cents - po.paid_amount_cents
        ELSE 0
      END) AS total_overdue_balance_cents
    FROM swimmers sw
    LEFT JOIN purchase_orders po ON po.swimmer_id = sw.id
    WHERE sw.is_vmrc_client = true
      AND sw.vmrc_coordinator_name IS NOT NULL
    GROUP BY sw.vmrc_coordinator_name, sw.vmrc_coordinator_email
    HAVING
      COUNT(CASE WHEN po.status = 'pending' AND po.submitted_at < NOW() - INTERVAL '14 days' THEN 1 END) > 0
      OR AVG(EXTRACT(EPOCH FROM (COALESCE(po.approved_at, NOW()) - po.submitted_at)) / 86400) > 14
      OR SUM(CASE WHEN po.billing_status = 'overdue' THEN po.billed_amount_cents - po.paid_amount_cents ELSE 0 END) > 0
    ORDER BY overdue_pos DESC, avg_response_days DESC, total_overdue_balance_cents DESC
    LIMIT 5
  )
  SELECT * FROM problem_coordinators;
END;
$$ LANGUAGE plpgsql;

-- Step 6: Create function to get swimmers with POS issues
CREATE OR REPLACE FUNCTION public.get_swimmers_with_pos_issues()
RETURNS TABLE (
  swimmer_name TEXT,
  coordinator_name TEXT,
  coordinator_email TEXT,
  sessions_used INTEGER,
  sessions_authorized INTEGER,
  pos_status TEXT,
  pos_requested TIMESTAMPTZ,
  days_pending NUMERIC,
  overdue_balance_cents INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    sw.first_name || ' ' || sw.last_name AS swimmer_name,
    sw.vmrc_coordinator_name AS coordinator_name,
    sw.vmrc_coordinator_email AS coordinator_email,
    sw.vmrc_sessions_used AS sessions_used,
    sw.vmrc_sessions_authorized AS sessions_authorized,
    po.status AS pos_status,
    po.submitted_at AS pos_requested,
    EXTRACT(EPOCH FROM (NOW() - po.submitted_at)) / 86400 AS days_pending,
    COALESCE(po.billed_amount_cents - po.paid_amount_cents, 0) AS overdue_balance_cents
  FROM swimmers sw
  LEFT JOIN purchase_orders po ON po.swimmer_id = sw.id
    AND (po.status = 'pending' OR po.billing_status = 'overdue')
  WHERE sw.is_vmrc_client = true
    AND (
      po.status = 'pending'
      OR sw.vmrc_sessions_used >= sw.vmrc_sessions_authorized - 2
      OR po.billing_status = 'overdue'
    )
  ORDER BY days_pending DESC NULLS LAST, overdue_balance_cents DESC;
END;
$$ LANGUAGE plpgsql;

-- Step 7: Create indexes for better performance on new queries
CREATE INDEX IF NOT EXISTS idx_purchase_orders_submitted_at ON public.purchase_orders(submitted_at);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_approved_at ON public.purchase_orders(approved_at);
CREATE INDEX IF NOT EXISTS idx_swimmers_vmrc_coordinator_email ON public.swimmers(vmrc_coordinator_email);

-- Step 8: Update existing purchase orders to set submitted_at if not set
UPDATE public.purchase_orders
SET submitted_at = created_at
WHERE submitted_at IS NULL;

-- Step 9: Add RLS policies for new table
ALTER TABLE public.coordinator_escalations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins have full access to coordinator_escalations" ON public.coordinator_escalations
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Step 10: Add trigger for updated_at on coordinator_escalations
CREATE TRIGGER update_coordinator_escalations_updated_at
  BEFORE UPDATE ON public.coordinator_escalations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Step 11: Create view for instructor performance dashboard
CREATE OR REPLACE VIEW public.instructor_performance_dashboard AS
SELECT
  p.id AS instructor_id,
  p.full_name AS instructor_name,
  p.email AS instructor_email,
  COUNT(DISTINCT s.id) AS total_sessions,
  COUNT(DISTINCT b.id) AS total_bookings,
  COUNT(DISTINCT b.swimmer_id) AS unique_swimmers,
  AVG(EXTRACT(EPOCH FROM (b.created_at - s.created_at)) / 86400) AS avg_days_to_book,
  COUNT(CASE WHEN s.status IN ('available', 'open') AND s.start_time > NOW() THEN s.id END) AS open_sessions,
  SUM(CASE WHEN s.status IN ('available', 'open') AND s.start_time > NOW() THEN s.max_capacity - s.booking_count ELSE 0 END) AS available_spots,
  COUNT(CASE WHEN b.status = 'cancelled' THEN b.id END) AS total_cancellations,
  COUNT(CASE WHEN b.status = 'cancelled' AND b.canceled_at > s.start_time - INTERVAL '24 hours' THEN b.id END) AS late_cancellations,
  ROUND(COUNT(CASE WHEN b.status = 'confirmed' THEN b.id END)::NUMERIC / NULLIF(COUNT(b.id), 0) * 100, 1) AS fill_rate_percent
FROM profiles p
LEFT JOIN sessions s ON s.instructor_id = p.id
LEFT JOIN bookings b ON b.session_id = s.id
WHERE p.role = 'instructor'
  AND s.start_time > NOW() - INTERVAL '90 days'
GROUP BY p.id, p.full_name, p.email;

-- Step 12: Create view for coordinator performance dashboard
CREATE OR REPLACE VIEW public.coordinator_performance_dashboard AS
SELECT
  sw.vmrc_coordinator_name AS coordinator_name,
  sw.vmrc_coordinator_email AS coordinator_email,
  COUNT(DISTINCT sw.id) AS swimmer_count,
  COUNT(DISTINCT po.id) AS total_pos,
  COUNT(CASE WHEN po.status = 'approved' THEN po.id END) AS approved_pos,
  COUNT(CASE WHEN po.status = 'pending' THEN po.id END) AS pending_pos,
  COUNT(CASE WHEN po.status = 'pending' AND po.submitted_at < NOW() - INTERVAL '14 days' THEN po.id END) AS overdue_pos,
  AVG(EXTRACT(EPOCH FROM (po.approved_at - po.submitted_at)) / 86400) AS avg_days_to_approve,
  SUM(CASE WHEN po.billing_status = 'overdue' THEN po.billed_amount_cents - po.paid_amount_cents ELSE 0 END) AS overdue_balance_cents,
  CASE
    WHEN COUNT(po.id) = 0 THEN 0
    ELSE ROUND(COUNT(CASE WHEN po.status = 'approved' THEN po.id END)::NUMERIC / COUNT(po.id) * 100, 1)
  END AS approval_rate_percent
FROM swimmers sw
LEFT JOIN purchase_orders po ON po.swimmer_id = sw.id
WHERE sw.is_vmrc_client = true
  AND sw.vmrc_coordinator_name IS NOT NULL
GROUP BY sw.vmrc_coordinator_name, sw.vmrc_coordinator_email;

-- Add comments for documentation
COMMENT ON FUNCTION public.get_instructor_booking_velocity IS 'Returns instructor performance metrics including booking velocity, open slots, and cancellations';
COMMENT ON FUNCTION public.get_coordinator_authorization_metrics IS 'Returns coordinator POS authorization metrics including response times and overdue POs';
COMMENT ON FUNCTION public.get_top_problem_coordinators IS 'Returns top 5 coordinators with the most issues (overdue POs, slow response, overdue balances)';
COMMENT ON FUNCTION public.get_swimmers_with_pos_issues IS 'Returns swimmers with POS issues (pending authorization, sessions used exceeding authorized, overdue balances)';
COMMENT ON VIEW public.instructor_performance_dashboard IS 'Dashboard view for instructor performance metrics';
COMMENT ON VIEW public.coordinator_performance_dashboard IS 'Dashboard view for coordinator performance metrics';