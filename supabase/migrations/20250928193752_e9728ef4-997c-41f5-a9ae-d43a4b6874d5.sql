-- Fix the RPC function by using public schema explicitly
DROP FUNCTION IF EXISTS get_prioritized_import_jobs();

CREATE OR REPLACE FUNCTION get_prioritized_import_jobs()
RETURNS TABLE (
  id uuid,
  job_id bigint,
  user_id uuid,
  bucket text,
  path text,
  mapping jsonb,
  status text,
  file_streamed boolean,
  created_at timestamp with time zone,
  processed_at timestamp with time zone,
  unprocessed_staging_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH job_staging_counts AS (
    SELECT 
      q.*,
      COALESCE((
        SELECT COUNT(*)::bigint 
        FROM public.shareholders_staging s 
        WHERE s.job_id = q.job_id 
        AND s.processed_at IS NULL
      ), 0) as unprocessed_staging_count
    FROM public.shareholder_import_queue q
    WHERE q.status IN ('pending', 'processing')
  )
  SELECT 
    jsc.id,
    jsc.job_id,
    jsc.user_id,
    jsc.bucket,
    jsc.path,
    jsc.mapping,
    jsc.status,
    jsc.file_streamed,
    jsc.created_at,
    jsc.processed_at,
    jsc.unprocessed_staging_count
  FROM job_staging_counts jsc
  WHERE 
    -- Include pending jobs OR processing jobs with unprocessed staging data
    (jsc.status = 'pending' OR (jsc.status = 'processing' AND jsc.unprocessed_staging_count > 0))
  ORDER BY 
    -- Prioritize by status first (pending before processing), then by most staging data
    CASE WHEN jsc.status = 'pending' THEN 0 ELSE 1 END,
    jsc.unprocessed_staging_count DESC,
    jsc.created_at ASC;
END;
$$;