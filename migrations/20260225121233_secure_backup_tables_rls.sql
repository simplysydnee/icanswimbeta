-- Migration: Add restrictive RLS policies to backup tables
-- Description: Add admin-only read access policies to backup tables with no modifications allowed
-- Date: 2026-02-25

-- Backup tables should only be accessible by admins for audit/recovery purposes
-- No modifications (INSERT, UPDATE, DELETE) should be allowed on backup data

-- 1. backup_bookings_20260205 - Admin only SELECT access
CREATE POLICY "Admins can view backup bookings"
ON backup_bookings_20260205 FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Deny all other operations
CREATE POLICY "No modifications to backup bookings"
ON backup_bookings_20260205 FOR ALL
TO authenticated
USING (false)
WITH CHECK (false);

-- 2. backup_sessions_20260205 - Admin only SELECT access
CREATE POLICY "Admins can view backup sessions"
ON backup_sessions_20260205 FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Deny all other operations
CREATE POLICY "No modifications to backup sessions"
ON backup_sessions_20260205 FOR ALL
TO authenticated
USING (false)
WITH CHECK (false);

-- 3. backup_swimmers_20260205 - Admin only SELECT access
CREATE POLICY "Admins can view backup swimmers"
ON backup_swimmers_20260205 FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Deny all other operations
CREATE POLICY "No modifications to backup swimmers"
ON backup_swimmers_20260205 FOR ALL
TO authenticated
USING (false)
WITH CHECK (false);

-- Verification query to check policies were applied
COMMENT ON TABLE backup_bookings_20260205 IS 'Backup table - Admin read-only access only';
COMMENT ON TABLE backup_sessions_20260205 IS 'Backup table - Admin read-only access only';
COMMENT ON TABLE backup_swimmers_20260205 IS 'Backup table - Admin read-only access only';