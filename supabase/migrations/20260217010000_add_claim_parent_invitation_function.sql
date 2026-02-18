-- Migration: Add atomic claim_parent_invitation function
-- Purpose: Handle parent invitation claiming in a single atomic transaction
-- Part of: Email mismatch validation feature
-- Date: 2026-02-17

-- Drop function if it exists (for rollback/re-run)
DROP FUNCTION IF EXISTS claim_parent_invitation(uuid, uuid, uuid);

-- Create the atomic claim function
CREATE OR REPLACE FUNCTION claim_parent_invitation(
  p_invitation_id uuid,
  p_user_id uuid,
  p_swimmer_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invitation_status text;
  v_invitation_swimmer_id uuid;
  v_invitation_expires_at timestamptz;
BEGIN
  -- Lock the invitation row for update to prevent race conditions
  SELECT status, swimmer_id, expires_at
  INTO v_invitation_status, v_invitation_swimmer_id, v_invitation_expires_at
  FROM parent_invitations
  WHERE id = p_invitation_id
  FOR UPDATE;

  -- Check if invitation exists
  IF v_invitation_status IS NULL THEN
    RAISE EXCEPTION 'Invitation not found';
  END IF;

  -- Check invitation status
  IF v_invitation_status != 'pending' THEN
    RAISE EXCEPTION 'Invitation has already been claimed or is not available (current status: %)', v_invitation_status;
  END IF;

  -- Check expiration
  IF v_invitation_expires_at < now() THEN
    RAISE EXCEPTION 'Invitation has expired';
  END IF;

  -- Verify swimmer matches invitation (security check)
  IF v_invitation_swimmer_id != p_swimmer_id THEN
    RAISE EXCEPTION 'Invitation does not match the specified swimmer';
  END IF;

  -- Update invitation status
  UPDATE parent_invitations
  SET
    status = 'claimed',
    claimed_by = p_user_id,
    claimed_at = now(),
    updated_at = now()
  WHERE id = p_invitation_id;

  -- Link swimmer to parent
  UPDATE swimmers
  SET
    parent_id = p_user_id,
    enrollment_status = 'pending_enrollment',
    updated_at = now()
  WHERE id = p_swimmer_id;

  -- Ensure parent role exists (user_role enum expects 'parent' value)
  INSERT INTO user_roles (user_id, role)
  VALUES (p_user_id, 'parent'::user_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  -- Log success (visible in PostgreSQL logs only, not returned to client)
  RAISE NOTICE 'Successfully claimed invitation % for user % and swimmer %',
    p_invitation_id, p_user_id, p_swimmer_id;

END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION claim_parent_invitation(uuid, uuid, uuid) TO authenticated;

-- Add helpful comment
COMMENT ON FUNCTION claim_parent_invitation(uuid, uuid, uuid) IS
  'Atomically claims a parent invitation by updating the invitation, linking the swimmer to the parent, and ensuring the parent role exists. This function prevents race conditions and ensures data consistency.';
