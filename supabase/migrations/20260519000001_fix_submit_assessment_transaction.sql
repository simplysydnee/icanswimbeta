-- Migration: 20260519000001_fix_submit_assessment_transaction.sql
-- Description:
--   Fixes two latent issues in submit_assessment_transaction() that caused
--   POST /api/assessments/complete to fail with no client-visible reason:
--     1) The RPC uses `ON CONFLICT (swimmer_id, assessment_date)` against the
--        assessments table, but no UNIQUE constraint/index existed on that
--        column pair, so Postgres raised
--        "there is no unique or exclusion constraint matching the ON CONFLICT
--        specification" on every call.
--     2) The function was not SECURITY DEFINER, so it ran under the caller's
--        RLS. The `assessments` table has an admin-only INSERT policy, which
--        blocked instructor-driven submissions even after the unique index
--        existed.
--
--   This migration:
--     * Aborts if existing rows would already violate the new uniqueness.
--     * Creates the missing unique index (IF NOT EXISTS for idempotency).
--     * Re-creates the function as SECURITY DEFINER with
--       `SET search_path TO 'public'` (per doc §9.11 hardening guidance).
--     * Function body is unchanged from the original at
--       20241222_assessment_functions.sql:5-71.

DO $$
DECLARE
  duplicate_count INTEGER;
BEGIN
  SELECT COUNT(*)
    INTO duplicate_count
    FROM (
      SELECT swimmer_id, assessment_date
        FROM public.assessments
       GROUP BY 1, 2
      HAVING COUNT(*) > 1
    ) dup;

  IF duplicate_count > 0 THEN
    RAISE EXCEPTION
      'Cannot create unique index on assessments(swimmer_id, assessment_date): % duplicate group(s) already exist. Clean them up before applying this migration.',
      duplicate_count;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS uniq_assessments_swimmer_date
  ON public.assessments (swimmer_id, assessment_date);

CREATE OR REPLACE FUNCTION public.submit_assessment_transaction(
  p_swimmer_id UUID,
  p_instructor_id UUID,
  p_assessment_date DATE,
  p_strengths TEXT,
  p_challenges TEXT,
  p_swim_skills JSONB,
  p_roadblocks JSONB,
  p_swim_skills_goals TEXT,
  p_safety_goals TEXT,
  p_approval_status TEXT,
  p_created_by UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO assessment_reports (
    swimmer_id,
    instructor_id,
    assessment_date,
    strengths,
    challenges,
    swim_skills,
    roadblocks,
    swim_skills_goals,
    safety_goals,
    approval_status,
    created_by
  ) VALUES (
    p_swimmer_id,
    p_instructor_id,
    p_assessment_date,
    p_strengths,
    p_challenges,
    p_swim_skills,
    p_roadblocks,
    p_swim_skills_goals,
    p_safety_goals,
    p_approval_status,
    p_created_by
  );

  INSERT INTO assessments (
    swimmer_id,
    instructor_id,
    assessment_date,
    status,
    completed_at,
    completed_by
  ) VALUES (
    p_swimmer_id,
    p_instructor_id,
    p_assessment_date,
    'completed',
    NOW(),
    p_created_by
  )
  ON CONFLICT (swimmer_id, assessment_date)
  DO UPDATE SET
    status = 'completed',
    completed_at = NOW(),
    completed_by = p_created_by,
    updated_at = NOW();
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_assessment_transaction TO authenticated;
