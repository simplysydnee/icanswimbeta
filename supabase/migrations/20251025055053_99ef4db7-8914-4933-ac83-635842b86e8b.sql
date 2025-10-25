-- Create parent invitation/claim tokens table
CREATE TABLE IF NOT EXISTS public.parent_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  swimmer_ids uuid[] NOT NULL, -- Array of swimmer IDs to link
  parent_email text NOT NULL,
  invitation_token text UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  claimed boolean DEFAULT false,
  claimed_by uuid REFERENCES auth.users(id),
  claimed_at timestamp with time zone,
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '30 days'),
  created_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.parent_invitations ENABLE ROW LEVEL SECURITY;

-- Only admins can create invitations
CREATE POLICY "Admins can create invitations"
ON public.parent_invitations
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Admins can view all invitations
CREATE POLICY "Admins can view all invitations"
ON public.parent_invitations
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow claiming invitations (public access for signup flow)
CREATE POLICY "Anyone can claim valid invitations"
ON public.parent_invitations
FOR UPDATE
USING (
  claimed = false 
  AND expires_at > now()
);

-- Create index for fast token lookups
CREATE INDEX IF NOT EXISTS idx_parent_invitations_token ON public.parent_invitations(invitation_token) WHERE claimed = false;
CREATE INDEX IF NOT EXISTS idx_parent_invitations_email ON public.parent_invitations(parent_email) WHERE claimed = false;