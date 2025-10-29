-- Add explicit RLS policy to block anonymous access to swimmers table
CREATE POLICY "Require authentication for swimmers"
ON public.swimmers
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Add comment explaining the security requirement
COMMENT ON POLICY "Require authentication for swimmers" ON public.swimmers IS 
'Critical security policy: Blocks anonymous access to sensitive children data including medical records, behavioral information, and family contact details.';