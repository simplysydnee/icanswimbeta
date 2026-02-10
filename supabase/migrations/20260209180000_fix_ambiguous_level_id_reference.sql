-- Migration: Fix ambiguous level_id reference in update_swimmer_level_on_skill_mastery function
-- This fixes the error "column reference 'level_id' is ambiguous" that occurs when updating swimmer_skills
-- The function had a variable named 'level_id' that conflicted with the column name in the skills table

CREATE OR REPLACE FUNCTION public.update_swimmer_level_on_skill_mastery()
RETURNS TRIGGER AS $$
DECLARE
  skill_level_id UUID;
  next_level_id UUID;
  mastered_skills_count INTEGER;
  total_skills_count INTEGER;
BEGIN
  -- Only run if status changed to 'mastered'
  IF NEW.status = 'mastered' AND (OLD.status IS NULL OR OLD.status != 'mastered') THEN
    -- Get the level_id of the skill that was just mastered
    SELECT s.level_id INTO skill_level_id
    FROM public.skills s
    WHERE s.id = NEW.skill_id;

    -- Count mastered skills for this swimmer at this level
    SELECT COUNT(*) INTO mastered_skills_count
    FROM public.swimmer_skills ss
    JOIN public.skills s ON ss.skill_id = s.id
    WHERE ss.swimmer_id = NEW.swimmer_id
      AND ss.status = 'mastered'
      AND s.level_id = skill_level_id;

    -- Count total skills at this level
    SELECT COUNT(*) INTO total_skills_count
    FROM public.skills
    WHERE public.skills.level_id = skill_level_id;

    -- If swimmer has mastered all skills at current level, promote to next level
    IF mastered_skills_count >= total_skills_count THEN
      -- Get next level
      SELECT id INTO next_level_id
      FROM public.swim_levels
      WHERE sequence = (
        SELECT sequence + 1
        FROM public.swim_levels
        WHERE id = skill_level_id
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

-- Note: The trigger already exists and references this function
-- This CREATE OR REPLACE will update the existing function with the corrected version

COMMENT ON FUNCTION public.update_swimmer_level_on_skill_mastery() IS
  'Automatically promotes swimmer to next level when all skills at current level are mastered. Fixed ambiguous level_id reference.';