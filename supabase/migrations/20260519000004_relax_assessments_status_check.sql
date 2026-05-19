-- Migration: 20260519000004_relax_assessments_status_check.sql
-- Description:
--   The wizard's save_assessment_draft RPC inserts assessments rows with
--   status='in_progress' for in-progress drafts. The live assessments table
--   has an existing CHECK constraint (assessments_status_check) that doesn't
--   allow 'in_progress', so the draft insert fails at runtime:
--     new row for relation "assessments" violates check constraint
--     "assessments_status_check"
--
--   This migration drops the existing CHECK and re-adds it with 'in_progress'
--   included. Uses NOT VALID so any legacy row whose status isn't in the new
--   whitelist is left untouched (per the user's "do not change any status
--   values" directive). New writes are enforced.
--
--   Idempotent: the DROP looks up the constraint name dynamically and skips
--   if not found. The ADD uses a fixed name so re-running this migration
--   would error on the second add — guard against that with a separate
--   existence check.

BEGIN;

DO $$
DECLARE
  v_constraint_name TEXT;
BEGIN
  -- Drop whatever CHECK constraint currently governs assessments.status,
  -- whatever it's named. (Usually 'assessments_status_check'.)
  SELECT conname
    INTO v_constraint_name
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
   WHERE t.relname = 'assessments'
     AND c.contype = 'c'
     AND pg_get_constraintdef(c.oid) ILIKE '%status%'
   LIMIT 1;

  IF v_constraint_name IS NOT NULL THEN
    EXECUTE format(
      'ALTER TABLE public.assessments DROP CONSTRAINT %I',
      v_constraint_name
    );
  END IF;
END $$;

-- Re-add the constraint with 'in_progress' included. NOT VALID so existing
-- rows are not re-checked.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
      FROM pg_constraint c
      JOIN pg_class t ON t.oid = c.conrelid
     WHERE t.relname = 'assessments'
       AND c.conname = 'assessments_status_check'
  ) THEN
    EXECUTE $sql$
      ALTER TABLE public.assessments
        ADD CONSTRAINT assessments_status_check
        CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled'))
        NOT VALID
    $sql$;
  END IF;
END $$;

COMMIT;
