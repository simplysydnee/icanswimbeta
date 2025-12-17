-- Migration: Add coordinator_id foreign key to properly link coordinators to swimmers
-- Date: 2024-12-17
-- Description: Adds coordinator_id columns to swimmers and referral_requests tables,
--              creates indexes, and backfills existing data from coordinator emails.

-- Add coordinator_id to swimmers table
ALTER TABLE swimmers
ADD COLUMN IF NOT EXISTS coordinator_id UUID REFERENCES profiles(id);

-- Add coordinator_id to referral_requests table
ALTER TABLE referral_requests
ADD COLUMN IF NOT EXISTS coordinator_id UUID REFERENCES profiles(id);

-- Add coordinator_id to parent_referral_requests table
ALTER TABLE parent_referral_requests
ADD COLUMN IF NOT EXISTS coordinator_id UUID REFERENCES profiles(id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_swimmers_coordinator_id ON swimmers(coordinator_id);
CREATE INDEX IF NOT EXISTS idx_referral_requests_coordinator_id ON referral_requests(coordinator_id);
CREATE INDEX IF NOT EXISTS idx_parent_referral_requests_coordinator_id ON parent_referral_requests(coordinator_id);

-- Backfill coordinator_id from email where possible
UPDATE swimmers s
SET coordinator_id = p.id
FROM profiles p
WHERE LOWER(s.vmrc_coordinator_email) = LOWER(p.email)
AND s.coordinator_id IS NULL
AND s.vmrc_coordinator_email IS NOT NULL;

UPDATE referral_requests r
SET coordinator_id = p.id
FROM profiles p
WHERE LOWER(r.coordinator_email) = LOWER(p.email)
AND r.coordinator_id IS NULL
AND r.coordinator_email IS NOT NULL;

UPDATE parent_referral_requests pr
SET coordinator_id = p.id
FROM profiles p
WHERE LOWER(pr.coordinator_email) = LOWER(p.email)
AND pr.coordinator_id IS NULL
AND pr.coordinator_email IS NOT NULL;