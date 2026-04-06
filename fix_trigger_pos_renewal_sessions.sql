-- Migration: Fix check_pos_renewal_needed() trigger hardcoded sessions
-- Date: 2026-03-05
-- Description: Fix trigger that auto-creates renewal POs with hardcoded 12 sessions
-- Issue: Trigger hardcodes sessions_authorized = 12 for new POs
--        Should calculate remaining sessions: sessions_authorized - sessions_used from expiring PO
--        Business decision needed: Should auto-creation be removed entirely?

-- WARNING: This requires business decision from Sydnee/Taylor
-- Two options:
-- 1. Remove auto-creation entirely, make it manual admin action
-- 2. Update trigger to calculate remaining sessions dynamically

-- Since we cannot find the check_pos_renewal_needed() function in migration files,
-- it might exist only in the live database. We need to:

-- 1. First check if the function exists in the live database:
-- SELECT pg_get_functiondef(oid) FROM pg_proc WHERE proname = 'check_pos_renewal_needed';

-- 2. Based on the function definition, decide on approach

-- Option 1: Remove auto-creation (recommended for control)
-- DROP TRIGGER IF EXISTS check_pos_renewal_needed_trigger ON public.swimmers;
-- DROP FUNCTION IF EXISTS public.check_pos_renewal_needed();

-- Option 2: Update to calculate remaining sessions
-- CREATE OR REPLACE FUNCTION public.check_pos_renewal_needed()
-- RETURNS TRIGGER AS $$
-- DECLARE
--   current_po RECORD;
--   remaining_sessions INTEGER;
-- BEGIN
--   -- Find the current active PO for this swimmer
--   SELECT * INTO current_po
--   FROM purchase_orders
--   WHERE swimmer_id = NEW.id
--     AND status IN ('in_progress', 'approved')
--     AND end_date >= CURRENT_DATE
--   ORDER BY end_date DESC
--   LIMIT 1;
--
--   IF FOUND AND NEW.sessions_used >= current_po.renewal_alert_threshold THEN
--     -- Calculate remaining sessions from current PO
--     remaining_sessions := current_po.allowed_lessons - current_po.lessons_used;
--
--     -- Create new PO with remaining sessions (or minimum of 1)
--     INSERT INTO purchase_orders (
--       swimmer_id,
--       funding_source_id,
--       po_type,
--       allowed_lessons,
--       start_date,
--       end_date,
--       status
--     ) VALUES (
--       NEW.id,
--       current_po.funding_source_id,
--       'lessons',
--       GREATEST(remaining_sessions, 1), -- At least 1 session
--       current_po.end_date + INTERVAL '1 day',
--       current_po.end_date + INTERVAL '3 months', -- Default 3-month duration
--       'pending'
--     );
--   END IF;
--
--   RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql;

-- Recommendation: Remove auto-creation and implement manual renewal workflow
-- This gives admins/coordinators more control and avoids incorrect auto-calculations