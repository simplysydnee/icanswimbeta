-- Add VMRC authorization tracking to swimmers table
ALTER TABLE public.swimmers
ADD COLUMN IF NOT EXISTS vmrc_sessions_used integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS vmrc_sessions_authorized integer DEFAULT 12,
ADD COLUMN IF NOT EXISTS vmrc_current_pos_number text,
ADD COLUMN IF NOT EXISTS vmrc_pos_expires_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS vmrc_pos_updated_by uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS vmrc_pos_updated_at timestamp with time zone;

-- Create table to track VMRC POS authorization history
CREATE TABLE IF NOT EXISTS public.vmrc_authorizations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  swimmer_id uuid NOT NULL REFERENCES public.swimmers(id) ON DELETE CASCADE,
  pos_number text NOT NULL,
  sessions_authorized integer NOT NULL DEFAULT 12,
  authorized_by uuid NOT NULL REFERENCES auth.users(id),
  authorized_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.vmrc_authorizations ENABLE ROW LEVEL SECURITY;

-- RLS policies for VMRC authorizations
CREATE POLICY "Parents can view their swimmers' VMRC authorizations"
ON public.vmrc_authorizations FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.swimmers
    WHERE swimmers.id = vmrc_authorizations.swimmer_id
    AND swimmers.parent_id = auth.uid()
  )
);

CREATE POLICY "Instructors and admins can view all VMRC authorizations"
ON public.vmrc_authorizations FOR SELECT
USING (has_role(auth.uid(), 'instructor'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Instructors and admins can create VMRC authorizations"
ON public.vmrc_authorizations FOR INSERT
WITH CHECK (
  (has_role(auth.uid(), 'instructor'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
  AND authorized_by = auth.uid()
);

CREATE POLICY "Admins can update VMRC authorizations"
ON public.vmrc_authorizations FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add comment for documentation
COMMENT ON TABLE public.vmrc_authorizations IS 'Tracks VMRC POS authorization numbers for subsidized swim sessions. VMRC clients need a new POS number every 12 sessions.';

COMMENT ON COLUMN public.swimmers.vmrc_sessions_used IS 'Number of sessions used from current VMRC authorization';
COMMENT ON COLUMN public.swimmers.vmrc_sessions_authorized IS 'Total number of sessions authorized by current POS number';
COMMENT ON COLUMN public.swimmers.vmrc_current_pos_number IS 'Current VMRC POS authorization number';