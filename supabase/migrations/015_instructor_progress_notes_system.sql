-- Migration: 015_instructor_progress_notes_system.sql
-- Description: Adds missing columns to progress_notes and creates RLS policies for instructors

-- 1. Add missing columns to progress_notes if they don't exist
DO $$
BEGIN
    -- Add lesson_date if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'progress_notes' AND column_name = 'lesson_date') THEN
        ALTER TABLE public.progress_notes ADD COLUMN lesson_date DATE;
    END IF;

    -- Add attendance_status if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'progress_notes' AND column_name = 'attendance_status') THEN
        ALTER TABLE public.progress_notes ADD COLUMN attendance_status TEXT DEFAULT 'present';
    END IF;

    -- Add swimmer_mood if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'progress_notes' AND column_name = 'swimmer_mood') THEN
        ALTER TABLE public.progress_notes ADD COLUMN swimmer_mood TEXT;
    END IF;

    -- Add water_comfort if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'progress_notes' AND column_name = 'water_comfort') THEN
        ALTER TABLE public.progress_notes ADD COLUMN water_comfort TEXT;
    END IF;

    -- Add focus_level if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'progress_notes' AND column_name = 'focus_level') THEN
        ALTER TABLE public.progress_notes ADD COLUMN focus_level TEXT;
    END IF;
END $$;

-- 2. Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_progress_notes_lesson_date ON public.progress_notes(lesson_date);
CREATE INDEX IF NOT EXISTS idx_progress_notes_attendance_status ON public.progress_notes(attendance_status);
CREATE INDEX IF NOT EXISTS idx_progress_notes_shared_with_parent ON public.progress_notes(shared_with_parent);

-- 3. Add RLS policies for instructors
-- Instructors can view progress notes they created
CREATE POLICY "Instructors can view own progress notes" ON public.progress_notes
  FOR SELECT USING (
    auth.uid() = instructor_id OR
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Instructors can insert progress notes for sessions they taught
CREATE POLICY "Instructors can insert progress notes" ON public.progress_notes
  FOR INSERT WITH CHECK (
    auth.uid() = instructor_id OR
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Instructors can update progress notes they created
CREATE POLICY "Instructors can update own progress notes" ON public.progress_notes
  FOR UPDATE USING (
    auth.uid() = instructor_id OR
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- 4. Add RLS policies for swimmer_skills table
-- Instructors can view swimmer skills for swimmers they teach
CREATE POLICY "Instructors can view swimmer skills" ON public.swimmer_skills
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.sessions s
      JOIN public.bookings b ON s.id = b.session_id
      WHERE b.swimmer_id = swimmer_skills.swimmer_id
      AND s.instructor_id = auth.uid()
    ) OR
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Instructors can update swimmer skills for swimmers they teach
CREATE POLICY "Instructors can update swimmer skills" ON public.swimmer_skills
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.sessions s
      JOIN public.bookings b ON s.id = b.session_id
      WHERE b.swimmer_id = swimmer_skills.swimmer_id
      AND s.instructor_id = auth.uid()
    ) OR
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Instructors can insert swimmer skills for swimmers they teach
CREATE POLICY "Instructors can insert swimmer skills" ON public.swimmer_skills
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.sessions s
      JOIN public.bookings b ON s.id = b.session_id
      WHERE b.swimmer_id = swimmer_skills.swimmer_id
      AND s.instructor_id = auth.uid()
    ) OR
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- 5. Add function to automatically set lesson_date from session
CREATE OR REPLACE FUNCTION set_progress_note_lesson_date()
RETURNS TRIGGER AS $$
BEGIN
  -- If lesson_date is not set, try to get it from the session
  IF NEW.lesson_date IS NULL AND NEW.session_id IS NOT NULL THEN
    SELECT DATE(start_time) INTO NEW.lesson_date
    FROM public.sessions
    WHERE id = NEW.session_id;
  END IF;

  -- If still null, use current date
  IF NEW.lesson_date IS NULL THEN
    NEW.lesson_date = CURRENT_DATE;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically set lesson_date
DROP TRIGGER IF EXISTS set_progress_note_lesson_date_trigger ON public.progress_notes;
CREATE TRIGGER set_progress_note_lesson_date_trigger
  BEFORE INSERT ON public.progress_notes
  FOR EACH ROW
  EXECUTE FUNCTION set_progress_note_lesson_date();

-- 6. Add function to update swimmer's current level when skills are mastered
CREATE OR REPLACE FUNCTION update_swimmer_level_on_skill_mastery()
RETURNS TRIGGER AS $$
DECLARE
  skill_record RECORD;
  next_level_id UUID;
  mastered_skills_count INTEGER;
  total_skills_count INTEGER;
BEGIN
  -- Only run if status changed to 'mastered'
  IF NEW.status = 'mastered' AND (OLD.status IS NULL OR OLD.status != 'mastered') THEN
    -- Get skill details
    SELECT s.level_id INTO skill_record
    FROM public.skills s
    WHERE s.id = NEW.skill_id;

    -- Count mastered skills for this swimmer at this level
    SELECT COUNT(*) INTO mastered_skills_count
    FROM public.swimmer_skills ss
    JOIN public.skills s ON ss.skill_id = s.id
    WHERE ss.swimmer_id = NEW.swimmer_id
      AND ss.status = 'mastered'
      AND s.level_id = skill_record.level_id;

    -- Count total skills at this level
    SELECT COUNT(*) INTO total_skills_count
    FROM public.skills
    WHERE public.skills.level_id = skill_record.level_id;

    -- If swimmer has mastered all skills at current level, promote to next level
    IF mastered_skills_count >= total_skills_count THEN
      -- Get next level
      SELECT id INTO next_level_id
      FROM public.swim_levels
      WHERE sequence = (
        SELECT sequence + 1
        FROM public.swim_levels
        WHERE id = skill_record.level_id
      );

      -- Update swimmer's current level
      IF next_level_id IS NOT NULL THEN
        UPDATE public.swimmers
        SET current_level_id = next_level_id, updated_at = NOW()
        WHERE id = NEW.swimmer_id;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update swimmer level
DROP TRIGGER IF EXISTS update_swimmer_level_trigger ON public.swimmer_skills;
CREATE TRIGGER update_swimmer_level_trigger
  AFTER UPDATE OF status ON public.swimmer_skills
  FOR EACH ROW
  EXECUTE FUNCTION update_swimmer_level_on_skill_mastery();

-- 7. Add view for instructor dashboard
CREATE OR REPLACE VIEW public.instructor_today_sessions AS
SELECT
  s.id as session_id,
  s.start_time,
  s.end_time,
  s.location,
  s.status as session_status,
  b.id as booking_id,
  b.status as booking_status,
  sw.id as swimmer_id,
  sw.first_name,
  sw.last_name,
  sw.current_level_id,
  sl.name as current_level_name,
  sl.color as level_color,
  pn.id as progress_note_id,
  pn.lesson_summary,
  pn.shared_with_parent,
  pn.created_at as note_created_at
FROM public.sessions s
JOIN public.bookings b ON s.id = b.session_id
JOIN public.swimmers sw ON b.swimmer_id = sw.id
LEFT JOIN public.swim_levels sl ON sw.current_level_id = sl.id
LEFT JOIN public.progress_notes pn ON b.id = pn.booking_id
WHERE DATE(s.start_time) = CURRENT_DATE
  AND s.instructor_id = auth.uid()
  AND b.status = 'confirmed'
ORDER BY s.start_time;

-- 8. Add comment to progress_notes table for documentation
COMMENT ON TABLE public.progress_notes IS 'Post-lesson documentation by instructors. Includes lesson summary, skills worked on, and notes for parents.';
COMMENT ON COLUMN public.progress_notes.lesson_summary IS 'Detailed summary of what was covered in the lesson';
COMMENT ON COLUMN public.progress_notes.instructor_notes IS 'Internal notes for instructors/admins only';
COMMENT ON COLUMN public.progress_notes.parent_notes IS 'Notes visible to parents when shared_with_parent is true';
COMMENT ON COLUMN public.progress_notes.skills_working_on IS 'Array of skill IDs that were worked on during the lesson';
COMMENT ON COLUMN public.progress_notes.skills_mastered IS 'Array of skill IDs that were mastered during the lesson';
COMMENT ON COLUMN public.progress_notes.shared_with_parent IS 'Whether this progress note has been shared with the parent';