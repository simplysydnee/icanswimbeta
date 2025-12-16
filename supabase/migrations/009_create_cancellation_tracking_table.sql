-- Cancellation tracking table for business analytics
CREATE TABLE IF NOT EXISTS cancellations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Who canceled
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
  swimmer_id UUID REFERENCES swimmers(id) ON DELETE SET NULL,
  parent_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  canceled_by UUID REFERENCES profiles(id),

  -- What was canceled
  cancellation_type TEXT NOT NULL CHECK (cancellation_type IN ('single', 'block', 'assessment')),
  block_id UUID,

  -- Session details (preserved even if session deleted)
  session_date TIMESTAMPTZ NOT NULL,
  session_start_time TIMESTAMPTZ NOT NULL,
  session_end_time TIMESTAMPTZ,
  session_location TEXT,
  instructor_id UUID REFERENCES profiles(id),
  instructor_name TEXT,

  -- Swimmer details (preserved)
  swimmer_name TEXT NOT NULL,
  swimmer_is_vmrc BOOLEAN DEFAULT false,

  -- Timing analytics
  canceled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  hours_before_session NUMERIC(10,2),
  was_late_cancellation BOOLEAN DEFAULT false,

  -- Reason and notes
  cancel_reason TEXT,
  cancel_source TEXT CHECK (cancel_source IN ('parent', 'admin', 'system', 'instructor')),
  admin_notes TEXT,

  -- Outcomes (admin controlled)
  marked_flexible_swimmer BOOLEAN DEFAULT false,
  created_floating_session BOOLEAN DEFAULT false,
  floating_session_id UUID REFERENCES floating_sessions(id),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for analytics queries
CREATE INDEX idx_cancellations_parent ON cancellations(parent_id);
CREATE INDEX idx_cancellations_swimmer ON cancellations(swimmer_id);
CREATE INDEX idx_cancellations_date ON cancellations(canceled_at);
CREATE INDEX idx_cancellations_session_date ON cancellations(session_date);
CREATE INDEX idx_cancellations_late ON cancellations(was_late_cancellation);
CREATE INDEX idx_cancellations_type ON cancellations(cancellation_type);
CREATE INDEX idx_cancellations_block ON cancellations(block_id);

-- Analytics view for reporting
CREATE OR REPLACE VIEW cancellation_analytics AS
SELECT
  DATE_TRUNC('month', canceled_at) as month,
  cancellation_type,
  cancel_source,
  was_late_cancellation,
  COUNT(*) as total_cancellations,
  COUNT(DISTINCT parent_id) as unique_parents,
  COUNT(DISTINCT swimmer_id) as unique_swimmers,
  AVG(hours_before_session) as avg_hours_notice,
  SUM(CASE WHEN marked_flexible_swimmer THEN 1 ELSE 0 END) as flexible_swimmer_marks,
  SUM(CASE WHEN created_floating_session THEN 1 ELSE 0 END) as floating_sessions_created
FROM cancellations
GROUP BY DATE_TRUNC('month', canceled_at), cancellation_type, cancel_source, was_late_cancellation;

-- RLS Policies
ALTER TABLE cancellations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parents can view own cancellations"
ON cancellations FOR SELECT
USING (parent_id = auth.uid());

CREATE POLICY "Admins can view all cancellations"
ON cancellations FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Authenticated users can insert cancellations"
ON cancellations FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);