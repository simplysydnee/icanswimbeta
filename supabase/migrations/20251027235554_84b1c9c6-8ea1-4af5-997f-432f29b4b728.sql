-- Update swim levels to new color-based system
-- First, delete existing skills to avoid foreign key issues
DELETE FROM swimmer_skills;
DELETE FROM skills;

-- Update swim levels with new color-based levels
UPDATE swim_levels SET 
  name = 'white',
  display_name = 'White',
  description = 'Water Readiness - Asking permission to get in the water',
  sequence = 1
WHERE sequence = 1;

UPDATE swim_levels SET 
  name = 'red',
  display_name = 'Red',
  description = 'Body Position and Air Exchange - Wearing lifejacket and jump in, and kick on back 10 feet',
  sequence = 2
WHERE sequence = 2;

UPDATE swim_levels SET 
  name = 'yellow',
  display_name = 'Yellow',
  description = 'Forward Movement and Direction Change - Tread water for 10 seconds',
  sequence = 3
WHERE sequence = 3;

UPDATE swim_levels SET 
  name = 'green',
  display_name = 'Green',
  description = 'Water Competency - Disorientating entries and recover',
  sequence = 4
WHERE sequence = 4;

UPDATE swim_levels SET 
  name = 'blue',
  display_name = 'Blue',
  description = 'Streamlines and Side Breathing - Reach and throw with assist flotation',
  sequence = 5
WHERE sequence = 5;

-- Insert new skills for White level
INSERT INTO skills (level_id, name, sequence, description)
SELECT id, 'Safely entering and exiting', 1, 'With support or independent'
FROM swim_levels WHERE name = 'white';

INSERT INTO skills (level_id, name, sequence, description)
SELECT id, 'Pour water on face and head', 2, 'With support or independent'
FROM swim_levels WHERE name = 'white';

INSERT INTO skills (level_id, name, sequence, description)
SELECT id, 'Breath hold and look under water', 3, 'With support or independent'
FROM swim_levels WHERE name = 'white';

INSERT INTO skills (level_id, name, sequence, description)
SELECT id, 'Tuck and stand from front', 4, 'With support or independent'
FROM swim_levels WHERE name = 'white';

INSERT INTO skills (level_id, name, sequence, description)
SELECT id, 'Relaxed submersion', 5, 'With support or independent'
FROM swim_levels WHERE name = 'white';

-- Insert new skills for Red level
INSERT INTO skills (level_id, name, sequence, description)
SELECT id, 'Starfish float front and back', 1, 'With support or independent'
FROM swim_levels WHERE name = 'red';

INSERT INTO skills (level_id, name, sequence, description)
SELECT id, 'Bobbing 5 times', 2, 'With support or independent'
FROM swim_levels WHERE name = 'red';

INSERT INTO skills (level_id, name, sequence, description)
SELECT id, 'Tuck and stand on back', 3, 'With support or independent'
FROM swim_levels WHERE name = 'red';

INSERT INTO skills (level_id, name, sequence, description)
SELECT id, 'Kicking on front and back (10 feet)', 4, 'With support or independent'
FROM swim_levels WHERE name = 'red';

INSERT INTO skills (level_id, name, sequence, description)
SELECT id, 'Jump or roll in, roll to back and breath', 5, 'With support or independent'
FROM swim_levels WHERE name = 'red';

-- Insert new skills for Yellow level
INSERT INTO skills (level_id, name, sequence, description)
SELECT id, 'Beginner stroke on front - face in', 1, 'With support or independent'
FROM swim_levels WHERE name = 'yellow';

INSERT INTO skills (level_id, name, sequence, description)
SELECT id, 'Beginner stroke on back', 2, 'With support or independent'
FROM swim_levels WHERE name = 'yellow';

INSERT INTO skills (level_id, name, sequence, description)
SELECT id, 'Beginner stroke with direction change', 3, 'With support or independent'
FROM swim_levels WHERE name = 'yellow';

INSERT INTO skills (level_id, name, sequence, description)
SELECT id, 'Roll to the back from the front', 4, 'With support or independent'
FROM swim_levels WHERE name = 'yellow';

INSERT INTO skills (level_id, name, sequence, description)
SELECT id, 'Swim-roll-swim', 5, 'With support or independent'
FROM swim_levels WHERE name = 'yellow';

-- Insert new skills for Green level
INSERT INTO skills (level_id, name, sequence, description)
SELECT id, '3 stroke - stop drill', 1, 'With support or independent'
FROM swim_levels WHERE name = 'green';

INSERT INTO skills (level_id, name, sequence, description)
SELECT id, '3 stroke - roll and rest', 2, 'With support or independent'
FROM swim_levels WHERE name = 'green';

INSERT INTO skills (level_id, name, sequence, description)
SELECT id, '3x3 swim drill', 3, 'With support or independent'
FROM swim_levels WHERE name = 'green';

INSERT INTO skills (level_id, name, sequence, description)
SELECT id, 'Tread water 40 seconds', 4, 'With support or independent'
FROM swim_levels WHERE name = 'green';

-- Insert new skills for Blue level
INSERT INTO skills (level_id, name, sequence, description)
SELECT id, 'Front and back streamline', 1, 'With support or independent'
FROM swim_levels WHERE name = 'blue';

INSERT INTO skills (level_id, name, sequence, description)
SELECT id, 'Swim underwater 3 feet', 2, 'With support or independent'
FROM swim_levels WHERE name = 'blue';

INSERT INTO skills (level_id, name, sequence, description)
SELECT id, 'Side breathing position with kick', 3, 'With support or independent'
FROM swim_levels WHERE name = 'blue';

INSERT INTO skills (level_id, name, sequence, description)
SELECT id, 'Side-roll-side with kick', 4, 'With support or independent'
FROM swim_levels WHERE name = 'blue';