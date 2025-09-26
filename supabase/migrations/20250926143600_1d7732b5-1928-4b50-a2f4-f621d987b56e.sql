-- Remove the old UUID version of process_shareholders_batch function
-- Keep only the bigint version to resolve type mismatch

DROP FUNCTION IF EXISTS public.process_shareholders_batch(p_job_id uuid, p_batch_size integer, p_max_errors integer);

-- Ensure only the bigint version exists (should already be there from previous migration)
-- This function should accept bigint job_id to match import_jobs.id column type