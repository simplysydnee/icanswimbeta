-- Allow swimmer deletion to leave related tasks intact (with swimmer_id nulled).
-- Spec requires: "If related swimmer is deleted later, task should remain and handle missing swimmer gracefully."

ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_swimmer_id_fkey;

ALTER TABLE public.tasks
  ADD CONSTRAINT tasks_swimmer_id_fkey
  FOREIGN KEY (swimmer_id) REFERENCES public.swimmers(id) ON DELETE SET NULL;
