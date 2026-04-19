-- Add company_name to tasks so the Tracker's Assign Task form
-- can tag a task with the client/company it belongs to.
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS company_name TEXT;
