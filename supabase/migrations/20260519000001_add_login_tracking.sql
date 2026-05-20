-- Add login tracking columns to profiles
ALTER TABLE public.profiles
ADD COLUMN last_login_at TIMESTAMPTZ,
ADD COLUMN login_count INTEGER DEFAULT 0;

-- RPC function for clients to update their own login tracking
CREATE OR REPLACE FUNCTION public.update_last_login()
RETURNS void
SECURITY DEFINER
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  UPDATE public.profiles
  SET last_login_at = now(),
      login_count = COALESCE(login_count, 0) + 1
  WHERE id = auth.uid();
END;
$$ LANGUAGE plpgsql;
