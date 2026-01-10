-- Direct SQL updates for UCI numbers
-- Run these in Supabase SQL Editor

-- 1. Alejandro Barajas (already updated by script)
-- UCI: 7763834 - Already updated

-- 2. Ellie Rose Castillo
UPDATE swimmers SET uci_number = 8657143 WHERE id = 'f8a6381e-4136-43b2-bcc3-f5f19f50edf2';

-- 3. Riley Ferry
UPDATE swimmers SET uci_number = 8658744 WHERE id = 'd7873f9a-91d1-4b09-b721-08b5638527fa';

-- 4. Cameron Harvey
UPDATE swimmers SET uci_number = 7779288 WHERE id = '2f8ab0dc-0103-4b89-8925-f9027577c720';

-- 5. Teghveer Sing
UPDATE swimmers SET uci_number = 8656331 WHERE id = 'd8842fd1-dd81-4079-9637-476c1bd2d6c1';

-- Verify updates
SELECT id, first_name, last_name, uci_number FROM swimmers WHERE id IN (
  'f8a6381e-4136-43b2-bcc3-f5f19f50edf2',
  'd7873f9a-91d1-4b09-b721-08b5638527fa',
  '2f8ab0dc-0103-4b89-8925-f9027577c720',
  'd8842fd1-dd81-4079-9637-476c1bd2d6c1'
);