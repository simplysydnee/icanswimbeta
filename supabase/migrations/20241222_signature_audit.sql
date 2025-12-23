-- Signature Audit Trail Migration
-- Adds audit trail fields for legally compliant electronic signatures (ESIGN Act)

-- Add audit fields to swimmers table
ALTER TABLE swimmers
ADD COLUMN IF NOT EXISTS electronic_consent_given BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS electronic_consent_timestamp TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS liability_waiver_signed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS cancellation_policy_signed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS photo_release_signed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS signature_ip_address TEXT,
ADD COLUMN IF NOT EXISTS signature_user_agent TEXT,
ADD COLUMN IF NOT EXISTS signature_metadata JSONB DEFAULT '{}'::jsonb;

-- Create separate signature audit table for better compliance
CREATE TABLE IF NOT EXISTS signature_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  swimmer_id UUID REFERENCES swimmers(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN ('liability_waiver', 'cancellation_policy', 'photo_release', 'electronic_consent')),
  signature_text TEXT,
  signer_name TEXT,
  signer_email TEXT,
  electronic_consent_given BOOLEAN DEFAULT true,
  signed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_signature_audit_swimmer ON signature_audit(swimmer_id);
CREATE INDEX IF NOT EXISTS idx_signature_audit_document_type ON signature_audit(document_type);
CREATE INDEX IF NOT EXISTS idx_signature_audit_signed_at ON signature_audit(signed_at);

-- Add comment explaining the purpose
COMMENT ON TABLE signature_audit IS 'Audit trail for legally compliant electronic signatures (ESIGN Act compliance)';
COMMENT ON COLUMN signature_audit.electronic_consent_given IS 'Whether user consented to electronic signatures (ESIGN Act requirement)';
COMMENT ON COLUMN signature_audit.ip_address IS 'IP address at time of signature (audit trail)';
COMMENT ON COLUMN signature_audit.user_agent IS 'Browser/user agent at time of signature (audit trail)';
COMMENT ON COLUMN signature_audit.metadata IS 'Additional signature metadata (timestamp, etc.)';

-- Update existing swimmers to have default values
UPDATE swimmers
SET
  electronic_consent_given = false,
  signature_metadata = '{}'::jsonb
WHERE electronic_consent_given IS NULL OR signature_metadata IS NULL;