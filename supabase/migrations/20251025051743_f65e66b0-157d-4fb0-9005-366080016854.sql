-- Add payment_type column to swimmers table
ALTER TABLE public.swimmers 
ADD COLUMN payment_type text NOT NULL DEFAULT 'private_pay';

-- Add check constraint for valid payment types
ALTER TABLE public.swimmers 
ADD CONSTRAINT valid_payment_type 
CHECK (payment_type IN ('private_pay', 'vmrc', 'scholarship', 'other'));

-- Update existing VMRC clients to have vmrc payment type
UPDATE public.swimmers 
SET payment_type = 'vmrc' 
WHERE is_vmrc_client = true;

-- Add comment to explain the column
COMMENT ON COLUMN public.swimmers.payment_type IS 'Payment type: private_pay (charged per session), vmrc (free, session count tracking), scholarship, or other';