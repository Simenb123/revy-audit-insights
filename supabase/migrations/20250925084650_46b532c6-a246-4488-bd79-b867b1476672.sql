-- Drop the old process_shareholders_batch function that takes bigint as job_id
-- This will resolve the "could not choose the best candidate function" error
-- and ensure only the updated version with UUID and correct ON CONFLICT clauses is used

DROP FUNCTION IF EXISTS public.process_shareholders_batch(bigint, uuid, integer, integer);