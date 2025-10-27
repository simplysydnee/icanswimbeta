-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view swim levels" ON swim_levels;
DROP POLICY IF EXISTS "Anyone can view skills" ON skills;

-- Create new permissive policies
CREATE POLICY "Anyone can view swim levels"
  ON swim_levels
  FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Anyone can view skills"
  ON skills
  FOR SELECT
  TO authenticated, anon
  USING (true);