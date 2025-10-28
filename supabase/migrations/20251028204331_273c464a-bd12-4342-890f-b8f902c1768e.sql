-- Add comments field and update status enum for purchase_orders
ALTER TABLE public.purchase_orders 
ADD COLUMN IF NOT EXISTS comments text;

-- Update status to include new values (completed, open, billed, closed)
-- The existing status field already exists, we'll handle the enum in the application layer
-- since we can't easily alter existing enum types without data migration

-- Create a comments table for POS to track history of comments
CREATE TABLE IF NOT EXISTS public.pos_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pos_id uuid NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  comment text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on pos_comments
ALTER TABLE public.pos_comments ENABLE ROW LEVEL SECURITY;

-- RLS policies for pos_comments
CREATE POLICY "Admins can manage POS comments"
ON public.pos_comments
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_pos_comments_pos_id ON public.pos_comments(pos_id);
CREATE INDEX IF NOT EXISTS idx_pos_comments_created_at ON public.pos_comments(created_at DESC);

-- Add trigger for updated_at
CREATE TRIGGER update_pos_comments_updated_at
BEFORE UPDATE ON public.pos_comments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();