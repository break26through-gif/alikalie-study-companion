
-- Add grading columns to assignment_submissions
ALTER TABLE public.assignment_submissions 
ADD COLUMN IF NOT EXISTS grade text,
ADD COLUMN IF NOT EXISTS feedback text,
ADD COLUMN IF NOT EXISTS graded_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS graded_by uuid;
