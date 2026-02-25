-- Migration: 20260225000008_backfill_parent_id_for_existing_bookings.sql
-- Description: Backfill parent_id for existing bookings where it's NULL
--              This fixes historical data consistency issue

-- Backfill parent_id for existing bookings where it's NULL
UPDATE bookings b
SET
  parent_id = s.parent_id,
  updated_at = now()
FROM swimmers s
WHERE b.swimmer_id = s.id
  AND b.parent_id IS NULL
  AND s.parent_id IS NOT NULL;

-- Log how many records were updated
DO $$
DECLARE
  updated_count integer;
BEGIN
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'Backfilled parent_id for % bookings', updated_count;
END $$;