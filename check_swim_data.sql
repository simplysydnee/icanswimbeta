-- 1. Check swim levels
SELECT * FROM swim_levels ORDER BY sequence;

-- 2. Check existing skills per level
SELECT sl.name as level, s.name as skill_name, s.id as skill_id
FROM skills s
JOIN swim_levels sl ON s.level_id = sl.id
ORDER BY sl.sequence, s.sequence;

-- 3. Check swimmer_skills structure
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'swimmer_skills';