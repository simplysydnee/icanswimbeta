-- Migration: 20260519000002_add_instructor_id_and_assessment_date_to_assessments.sql
-- Description:
--   Brings the live public.assessments table in line with what the
--   submit_assessment_transaction RPC (and the rest of the codebase) expects.
--
--   Background:
--     001_core_tables.sql created public.assessments with `scheduled_date`
--     (no `assessment_date`) and NO `instructor_id`.
--     20241222_assessment_reports.sql attempted to recreate the table with the
--     intended shape using `CREATE TABLE IF NOT EXISTS`, but because the table
--     already existed, that statement was a no-op and the new columns never
--     landed. The RPC at 20241222_assessment_functions.sql then fails on every
--     call with:
--       column "instructor_id" of relation "assessments" does not exist (42703)
--
--   This migration:
--     1) Adds `instructor_id` (uuid, nullable, FK -> profiles).
--     2) Adds `assessment_date` (date, nullable).
--     3) Best-effort backfills `assessment_date` from `scheduled_date`.
--     4) Best-effort backfills `instructor_id` from `completed_by` for rows
--        that were already completed (the closest available proxy).
--     5) Verifies no duplicate (swimmer_id, assessment_date) rows exist, then
--        re-creates the unique index used by the RPC's ON CONFLICT clause.
--
--   Columns stay nullable on purpose: the RPC always supplies values for new
--   inserts, and historical rows that cannot be backfilled remain queryable.

BEGIN;

ALTER TABLE public.assessments
  ADD COLUMN IF NOT EXISTS instructor_id UUID
    REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.assessments
  ADD COLUMN IF NOT EXISTS assessment_date DATE;

-- Backfill assessment_date from the legacy scheduled_date column where possible
UPDATE public.assessments
   SET assessment_date = scheduled_date
 WHERE assessment_date IS NULL
   AND scheduled_date IS NOT NULL;

-- Backfill instructor_id from completed_by for already-completed historical
-- rows. This is a best-effort proxy: completed_by is the staff member who
-- closed the assessment, which is typically the conducting instructor.
UPDATE public.assessments
   SET instructor_id = completed_by
 WHERE instructor_id IS NULL
   AND completed_by IS NOT NULL;

-- Defensive uniqueness pre-check before (re)creating the index. If duplicates
-- exist the migration aborts so the operator can clean them up rather than
-- silently leaving the RPC's ON CONFLICT clause broken.
DO $$
DECLARE
  duplicate_count INTEGER;
BEGIN
  SELECT COUNT(*)
    INTO duplicate_count
    FROM (
      SELECT swimmer_id, assessment_date
        FROM public.assessments
       WHERE swimmer_id IS NOT NULL
         AND assessment_date IS NOT NULL
       GROUP BY 1, 2
      HAVING COUNT(*) > 1
    ) dup;

  IF duplicate_count > 0 THEN
    RAISE EXCEPTION
      'Cannot create unique index on assessments(swimmer_id, assessment_date): % duplicate group(s) already exist. Clean them up before applying this migration.',
      duplicate_count;
  END IF;
END $$;

-- Drop + recreate the unique index. The prior migration tried to create it
-- before assessment_date existed; redoing it here guarantees the correct
-- end state regardless of whether that earlier attempt succeeded.
DROP INDEX IF EXISTS public.uniq_assessments_swimmer_date;
CREATE UNIQUE INDEX uniq_assessments_swimmer_date
  ON public.assessments (swimmer_id, assessment_date);

COMMIT;
