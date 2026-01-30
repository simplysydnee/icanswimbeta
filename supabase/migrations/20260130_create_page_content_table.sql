-- Migration: 20260130_create_page_content_table.sql
-- Description: Creates page_content table for storing editable content on public website pages

-- Create the update_updated_at_column function if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Table to store editable page content
CREATE TABLE IF NOT EXISTS public.page_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_slug TEXT NOT NULL, -- 'home', 'about', 'team', 'programs', 'pricing', 'regional-centers', 'faq', 'contact'
  section_key TEXT NOT NULL, -- 'hero-title', 'hero-subtitle', 'mission-statement', etc.
  content_type TEXT NOT NULL DEFAULT 'text', -- 'text', 'richtext', 'image_url'
  content TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID REFERENCES public.profiles(id),

  UNIQUE(page_slug, section_key)
);

-- Create indexes for performance
CREATE INDEX idx_page_content_page_slug ON public.page_content(page_slug);
CREATE INDEX idx_page_content_section_key ON public.page_content(section_key);
CREATE INDEX idx_page_content_is_published ON public.page_content(is_published) WHERE is_published = true;

-- Create trigger for automatic updated_at
CREATE TRIGGER update_page_content_updated_at
  BEFORE UPDATE ON public.page_content
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE public.page_content ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view published content
CREATE POLICY "Anyone can view published page content"
  ON public.page_content FOR SELECT
  USING (is_published = true);

-- Policy: Only admins can update page content
CREATE POLICY "Admins can update page content"
  ON public.page_content FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- Policy: Only admins can insert page content
CREATE POLICY "Admins can insert page content"
  ON public.page_content FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- Policy: Only admins can delete page content
CREATE POLICY "Admins can delete page content"
  ON public.page_content FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- Seed initial content from current home page
INSERT INTO public.page_content (page_slug, section_key, content_type, content) VALUES
  ('home', 'hero-title', 'text', 'I Can Swim'),
  ('home', 'hero-subtitle', 'text', 'Adaptive Swim Lessons'),
  ('home', 'trust-badges-swimmers', 'text', '300+'),
  ('home', 'trust-badges-swimmers-label', 'text', 'Swimmers Served'),
  ('home', 'trust-badges-experience', 'text', '15+'),
  ('home', 'trust-badges-experience-label', 'text', 'Years Experience'),
  ('home', 'trust-badges-satisfaction', 'text', '98%'),
  ('home', 'trust-badges-satisfaction-label', 'text', 'Parent Satisfaction'),
  ('home', 'how-it-works-title', 'text', 'How It Works'),
  ('home', 'how-it-works-description', 'text', 'Simple, safe, and effective swim lessons designed specifically for individuals with special needs'),
  ('home', 'step-1-number', 'text', '1'),
  ('home', 'step-1-title', 'text', 'Initial Assessment'),
  ('home', 'step-1-description', 'text', 'We evaluate each swimmer''s comfort level and swimming abilities to create a personalized lesson plan'),
  ('home', 'step-2-number', 'text', '2'),
  ('home', 'step-2-title', 'text', 'Personalized Lessons'),
  ('home', 'step-2-description', 'text', 'One-on-one instruction tailored to each individual''s unique needs and learning style'),
  ('home', 'step-3-number', 'text', '3'),
  ('home', 'step-3-title', 'text', 'Progress Tracking'),
  ('home', 'step-3-description', 'text', 'Regular updates on each swimmer''s achievements and skill development'),
  ('home', 'why-choose-us-title', 'text', 'Why Choose I Can Swim'),
  ('home', 'why-choose-us-description', 'text', 'The experts you can trust with each swimmer''s swimming journey'),
  ('home', 'feature-1-title', 'text', 'Specialized Expertise'),
  ('home', 'feature-1-description', 'text', 'Our instructors are trained in adaptive swim techniques for individuals with autism, Down syndrome, and other special needs'),
  ('home', 'feature-2-title', 'text', 'Funding Approved'),
  ('home', 'feature-2-description', 'text', 'We work directly with regional centers and funding sources to provide swim lessons for eligible individuals'),
  ('home', 'feature-3-title', 'text', 'Safety First Approach'),
  ('home', 'feature-3-description', 'text', 'Certified lifeguards with specialized safety protocols and certifications ensure each swimmer''s wellbeing in and around the water'),
  ('home', 'feature-4-title', 'text', 'Individualized Attention'),
  ('home', 'feature-4-description', 'text', 'One-on-one instruction allows us to focus on each swimmer''s specific goals and comfort level'),
  ('home', 'feature-5-title', 'text', 'Proven Results'),
  ('home', 'feature-5-description', 'text', 'Track record of helping swimmers build confidence, improve coordination, and develop essential water safety skills'),
  ('home', 'feature-6-title', 'text', 'Flexible Scheduling'),
  ('home', 'feature-6-description', 'text', 'Convenient location in Modesto with flexible scheduling to fit your family''s needs'),
  ('home', 'cta-title', 'text', 'Ready to Start Your Swimming Journey?'),
  ('home', 'cta-description', 'text', 'Join hundreds of families who trust I Can Swim with their swimmer''s water safety and swimming development')
ON CONFLICT (page_slug, section_key) DO NOTHING;