-- Migration: 20260519000003_enable_incremental_assessment_drafts.sql
-- Description:
--   Enables incremental persistence of the AssessmentWizard. Every step
--   transition writes to the real tables (assessments, assessment_reports,
--   progress_notes) so a user returning later (even on a different device)
--   sees their prior values. The data is only promoted to "completed" by the
--   existing /api/assessments/complete route on final submit.
--
--   What this migration changes:
--     1) Makes assessment_reports.approval_status NULLable and relaxes its
--        CHECK constraint to allow NULL during drafting.
--     2) Adds UNIQUE indexes used as ON CONFLICT targets for the upserts:
--          - assessment_reports (swimmer_id, assessment_date)
--          - assessments (booking_id) WHERE booking_id IS NOT NULL
--          - progress_notes (swimmer_id, booking_id) WHERE booking_id IS NOT NULL
--     3) Creates save_assessment_draft(...) SECURITY DEFINER function that
--        does the three-table upsert atomically with elevated privileges
--        (so instructors can write to assessments despite the admin-only RLS).
--     4) Redefines submit_assessment_transaction(...) so its
--        assessment_reports INSERT also uses ON CONFLICT DO UPDATE — needed
--        because the draft row will already exist when the final submit hits.

BEGIN;

-- 1) Drop the existing inline CHECK constraint on approval_status. The name
--    is auto-generated so we find it dynamically. Also drop NOT NULL.
DO $$
DECLARE
  v_constraint_name TEXT;
BEGIN
  SELECT conname
    INTO v_constraint_name
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
   WHERE t.relname = 'assessment_reports'
     AND c.contype = 'c'
     AND pg_get_constraintdef(c.oid) ILIKE '%approval_status%'
   LIMIT 1;

  IF v_constraint_name IS NOT NULL THEN
    EXECUTE format(
      'ALTER TABLE public.assessment_reports DROP CONSTRAINT %I',
      v_constraint_name
    );
  END IF;
END $$;

ALTER TABLE public.assessment_reports
  ALTER COLUMN approval_status DROP NOT NULL;

-- NOT VALID: enforce the rule on all NEW inserts/updates, but skip validating
-- existing rows. Legacy data (e.g. 'pending', 'declined', or stray empty
-- strings from earlier schemas) stays untouched per the user's directive
-- "do not change any status values". The admin can later run
--   ALTER TABLE public.assessment_reports
--     VALIDATE CONSTRAINT assessment_reports_approval_status_check;
-- after cleaning up the legacy values, if/when they want strict enforcement.
ALTER TABLE public.assessment_reports
  ADD CONSTRAINT assessment_reports_approval_status_check
  CHECK (approval_status IS NULL OR approval_status IN ('approved', 'dropped'))
  NOT VALID;

-- 1b) Bring a booking_id column onto assessment_reports so the new unique key
--     can be (swimmer_id, assessment_date, booking_id) — needed because the
--     2-column key collides with legacy duplicate rows that we are NOT
--     deduping per user directive. Backfill from the linked assessments row.
ALTER TABLE public.assessment_reports
  ADD COLUMN IF NOT EXISTS booking_id UUID
    REFERENCES public.bookings(id) ON DELETE SET NULL;

UPDATE public.assessment_reports ar
   SET booking_id = a.booking_id
  FROM public.assessments a
 WHERE ar.booking_id IS NULL
   AND ar.assessment_id = a.id
   AND a.booking_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_assessment_reports_booking_id
  ON public.assessment_reports (booking_id);

-- 2) UNIQUE indexes for ON CONFLICT targets. Pre-check each so duplicates
--    fail loudly instead of silently breaking subsequent upserts.

-- assessment_reports (swimmer_id, assessment_date, booking_id).
-- We include booking_id to avoid colliding with legacy duplicate rows whose
-- booking_id is NULL (Postgres treats NULLs as distinct in unique indexes by
-- default). Only rows with a real booking_id participate in the uniqueness
-- check below.
DO $$
DECLARE
  dup_count INTEGER;
BEGIN
  SELECT COUNT(*)
    INTO dup_count
    FROM (
      SELECT swimmer_id, assessment_date, booking_id
        FROM public.assessment_reports
       WHERE swimmer_id IS NOT NULL
         AND assessment_date IS NOT NULL
         AND booking_id IS NOT NULL
       GROUP BY 1, 2, 3
      HAVING COUNT(*) > 1
    ) d;

  IF dup_count > 0 THEN
    RAISE EXCEPTION
      'Cannot create unique index on assessment_reports(swimmer_id, assessment_date, booking_id): % duplicate group(s) exist. Clean them up first.',
      dup_count;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS uniq_assessment_reports_swimmer_date_booking
  ON public.assessment_reports (swimmer_id, assessment_date, booking_id);

-- assessments (booking_id) WHERE booking_id IS NOT NULL
DO $$
DECLARE
  dup_count INTEGER;
BEGIN
  SELECT COUNT(*)
    INTO dup_count
    FROM (
      SELECT booking_id
        FROM public.assessments
       WHERE booking_id IS NOT NULL
       GROUP BY 1
      HAVING COUNT(*) > 1
    ) d;

  IF dup_count > 0 THEN
    RAISE EXCEPTION
      'Cannot create unique index on assessments(booking_id): % duplicate booking_id group(s) exist. Clean them up first.',
      dup_count;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS uniq_assessments_booking_id
  ON public.assessments (booking_id)
  WHERE booking_id IS NOT NULL;

-- progress_notes (swimmer_id, booking_id) WHERE booking_id IS NOT NULL.
-- Staff-mode notes have booking_id = NULL (multiple allowed per lesson is fine).
-- Wizard notes always carry the assessment booking_id and should be unique per
-- assessment booking — that's what we constrain here.
DO $$
DECLARE
  dup_count INTEGER;
BEGIN
  SELECT COUNT(*)
    INTO dup_count
    FROM (
      SELECT swimmer_id, booking_id
        FROM public.progress_notes
       WHERE swimmer_id IS NOT NULL AND booking_id IS NOT NULL
       GROUP BY 1, 2
      HAVING COUNT(*) > 1
    ) d;

  IF dup_count > 0 THEN
    RAISE EXCEPTION
      'Cannot create unique index on progress_notes(swimmer_id, booking_id): % duplicate group(s) exist. Clean them up first.',
      dup_count;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS uniq_progress_notes_swimmer_booking
  ON public.progress_notes (swimmer_id, booking_id)
  WHERE booking_id IS NOT NULL;

-- 3) save_assessment_draft — SECURITY DEFINER so instructors can write to
--    assessments despite admin-only RLS. Pure data-write; no swimmer status
--    flip, no email, no booking completion (those stay on the final-submit path).
CREATE OR REPLACE FUNCTION public.save_assessment_draft(
  p_caller_id      UUID,
  p_swimmer_id     UUID,
  p_booking_id     UUID,
  p_session_id     UUID,
  p_instructor_id  UUID,
  p_assessment_date DATE,
  p_strengths      TEXT,
  p_challenges     TEXT,
  p_swim_skills    JSONB,
  p_roadblocks     JSONB,
  p_swim_skills_goals TEXT,
  p_safety_goals   TEXT,
  -- Step 5 fields (optional; pass NULLs / empties if not provided)
  p_lesson_date    DATE,
  p_attendance_status TEXT,
  p_lesson_summary TEXT,
  p_swimmer_mood   TEXT,
  p_water_comfort  TEXT,
  p_instructor_notes_private TEXT,
  p_parent_notes   TEXT,
  p_shared_with_parent BOOLEAN,
  p_has_note_content BOOLEAN
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_assessment_id UUID;
  v_assessment_report_id UUID;
  v_existing_status TEXT;
BEGIN
  -- Refuse to overwrite an already-completed assessment.
  SELECT status INTO v_existing_status
    FROM public.assessments
   WHERE booking_id = p_booking_id
   LIMIT 1;

  IF v_existing_status = 'completed' THEN
    RAISE EXCEPTION 'Cannot save draft: assessment for booking % is already completed', p_booking_id
      USING ERRCODE = 'check_violation';
  END IF;

  -- UPSERT assessments by booking_id. Status stays 'in_progress' for drafts;
  -- if the row already exists with status='in_progress' we keep it; if it was
  -- still 'scheduled' we move it forward to 'in_progress'.
  INSERT INTO public.assessments (
    swimmer_id, instructor_id, booking_id, session_id,
    assessment_date, status, updated_at
  ) VALUES (
    p_swimmer_id, p_instructor_id, p_booking_id, p_session_id,
    p_assessment_date, 'in_progress', NOW()
  )
  ON CONFLICT (booking_id) WHERE booking_id IS NOT NULL
  DO UPDATE SET
    instructor_id   = COALESCE(public.assessments.instructor_id, EXCLUDED.instructor_id),
    session_id      = COALESCE(public.assessments.session_id, EXCLUDED.session_id),
    assessment_date = EXCLUDED.assessment_date,
    status          = CASE
                        WHEN public.assessments.status = 'completed' THEN public.assessments.status
                        ELSE 'in_progress'
                      END,
    updated_at      = NOW()
  RETURNING id INTO v_assessment_id;

  -- UPSERT assessment_reports by (swimmer_id, assessment_date, booking_id).
  -- approval_status stays NULL during drafting; only the final-submit path
  -- sets it.
  INSERT INTO public.assessment_reports (
    swimmer_id, instructor_id, assessment_id, assessment_date, booking_id,
    strengths, challenges, swim_skills, roadblocks,
    swim_skills_goals, safety_goals, approval_status,
    created_by, updated_at
  ) VALUES (
    p_swimmer_id, p_instructor_id, v_assessment_id, p_assessment_date, p_booking_id,
    p_strengths, p_challenges, p_swim_skills, p_roadblocks,
    p_swim_skills_goals, p_safety_goals, NULL,
    p_caller_id, NOW()
  )
  ON CONFLICT (swimmer_id, assessment_date, booking_id)
  DO UPDATE SET
    instructor_id     = COALESCE(public.assessment_reports.instructor_id, EXCLUDED.instructor_id),
    assessment_id     = COALESCE(public.assessment_reports.assessment_id, EXCLUDED.assessment_id),
    strengths         = EXCLUDED.strengths,
    challenges        = EXCLUDED.challenges,
    swim_skills       = EXCLUDED.swim_skills,
    roadblocks        = EXCLUDED.roadblocks,
    swim_skills_goals = EXCLUDED.swim_skills_goals,
    safety_goals      = EXCLUDED.safety_goals,
    updated_at        = NOW()
    -- approval_status intentionally NOT touched here — only the final submit
    -- path sets it. Preserving any existing value is safe.
  RETURNING id INTO v_assessment_report_id;

  -- UPSERT progress_notes only when Step 5 has at least one piece of content.
  IF p_has_note_content THEN
    INSERT INTO public.progress_notes (
      swimmer_id, instructor_id, updated_by,
      session_id, booking_id,
      lesson_date, attendance_status, lesson_summary,
      swimmer_mood, water_comfort,
      instructor_notes, parent_notes, shared_with_parent,
      created_at, updated_at
    ) VALUES (
      p_swimmer_id, p_instructor_id, p_caller_id,
      p_session_id, p_booking_id,
      COALESCE(p_lesson_date, p_assessment_date), COALESCE(p_attendance_status, 'present'), NULLIF(p_lesson_summary, ''),
      NULLIF(p_swimmer_mood, ''), NULLIF(p_water_comfort, ''),
      NULLIF(p_instructor_notes_private, ''), NULLIF(p_parent_notes, ''), COALESCE(p_shared_with_parent, FALSE),
      NOW(), NOW()
    )
    ON CONFLICT (swimmer_id, booking_id) WHERE booking_id IS NOT NULL
    DO UPDATE SET
      session_id         = COALESCE(public.progress_notes.session_id, EXCLUDED.session_id),
      lesson_date        = EXCLUDED.lesson_date,
      attendance_status  = EXCLUDED.attendance_status,
      lesson_summary     = EXCLUDED.lesson_summary,
      swimmer_mood       = EXCLUDED.swimmer_mood,
      water_comfort      = EXCLUDED.water_comfort,
      instructor_notes   = EXCLUDED.instructor_notes,
      parent_notes       = EXCLUDED.parent_notes,
      shared_with_parent = EXCLUDED.shared_with_parent,
      updated_by         = EXCLUDED.updated_by,
      updated_at         = NOW();
  END IF;

  RETURN jsonb_build_object(
    'assessment_id', v_assessment_id,
    'assessment_report_id', v_assessment_report_id
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.save_assessment_draft(
  UUID, UUID, UUID, UUID, UUID, DATE,
  TEXT, TEXT, JSONB, JSONB, TEXT, TEXT,
  DATE, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, BOOLEAN, BOOLEAN
) TO authenticated;

-- 4) Redefine submit_assessment_transaction so its assessment_reports INSERT
--    uses ON CONFLICT (swimmer_id, assessment_date, booking_id) DO UPDATE —
--    required because the draft row already exists by the time the final
--    submit fires, and the new unique key is 3-column.
--
--    Drop the old 11-arg signature first; PostgreSQL identifies functions by
--    (name, arg types) so CREATE OR REPLACE alone won't replace the prior
--    version with a different parameter list.
DROP FUNCTION IF EXISTS public.submit_assessment_transaction(
  UUID, UUID, DATE, TEXT, TEXT, JSONB, JSONB, TEXT, TEXT, TEXT, UUID
);

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
  p_created_by UUID,
  p_booking_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.assessment_reports (
    swimmer_id, instructor_id, assessment_date, booking_id,
    strengths, challenges, swim_skills, roadblocks,
    swim_skills_goals, safety_goals, approval_status, created_by,
    updated_at
  ) VALUES (
    p_swimmer_id, p_instructor_id, p_assessment_date, p_booking_id,
    p_strengths, p_challenges, p_swim_skills, p_roadblocks,
    p_swim_skills_goals, p_safety_goals, p_approval_status, p_created_by,
    NOW()
  )
  ON CONFLICT (swimmer_id, assessment_date, booking_id)
  DO UPDATE SET
    instructor_id     = EXCLUDED.instructor_id,
    strengths         = EXCLUDED.strengths,
    challenges        = EXCLUDED.challenges,
    swim_skills       = EXCLUDED.swim_skills,
    roadblocks        = EXCLUDED.roadblocks,
    swim_skills_goals = EXCLUDED.swim_skills_goals,
    safety_goals      = EXCLUDED.safety_goals,
    approval_status   = EXCLUDED.approval_status,
    updated_at        = NOW();

  -- Mark the assessments row completed. Pin by booking_id when available so
  -- the row created by save_assessment_draft (status='in_progress') is the
  -- one that's promoted; fall back to (swimmer_id, assessment_date) for the
  -- legacy direct-submit case.
  IF p_booking_id IS NOT NULL THEN
    INSERT INTO public.assessments (
      swimmer_id, instructor_id, booking_id, assessment_date,
      status, completed_at, completed_by
    ) VALUES (
      p_swimmer_id, p_instructor_id, p_booking_id, p_assessment_date,
      'completed', NOW(), p_created_by
    )
    ON CONFLICT (booking_id) WHERE booking_id IS NOT NULL
    DO UPDATE SET
      status       = 'completed',
      completed_at = NOW(),
      completed_by = p_created_by,
      updated_at   = NOW();
  ELSE
    INSERT INTO public.assessments (
      swimmer_id, instructor_id, assessment_date,
      status, completed_at, completed_by
    ) VALUES (
      p_swimmer_id, p_instructor_id, p_assessment_date,
      'completed', NOW(), p_created_by
    )
    ON CONFLICT (swimmer_id, assessment_date)
    DO UPDATE SET
      status       = 'completed',
      completed_at = NOW(),
      completed_by = p_created_by,
      updated_at   = NOW();
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_assessment_transaction(
  UUID, UUID, DATE, TEXT, TEXT, JSONB, JSONB, TEXT, TEXT, TEXT, UUID, UUID
) TO authenticated;

COMMIT;
