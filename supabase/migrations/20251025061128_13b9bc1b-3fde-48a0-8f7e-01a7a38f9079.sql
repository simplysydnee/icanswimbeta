-- Create storage bucket for referral photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('vmrc-referrals', 'vmrc-referrals', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for vmrc-referrals bucket
CREATE POLICY "Anyone can upload referral photos"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'vmrc-referrals');

CREATE POLICY "Anyone can view referral photos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'vmrc-referrals');

CREATE POLICY "Admins can delete referral photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'vmrc-referrals' 
  AND has_role(auth.uid(), 'admin'::app_role)
);