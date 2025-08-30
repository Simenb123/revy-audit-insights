-- Fix database function conflicts by removing the problematic overloaded function
-- Keep only the most comprehensive version that handles bulk operations

-- Drop the problematic overloaded function with different parameter order
DROP FUNCTION IF EXISTS public.update_total_shares_for_year(p_orgnr text, p_year integer, p_user_id uuid);

-- Ensure we have the correct function signature for bulk operations
-- This function should handle both single company and all companies for a year
CREATE OR REPLACE FUNCTION public.update_total_shares_for_year(
    p_year integer, 
    p_orgnr text DEFAULT NULL, 
    p_user_id uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  company_record RECORD;
  total_shares_count integer;
BEGIN
  -- If p_orgnr is null, update all companies for the year/user
  IF p_orgnr IS NULL THEN
    FOR company_record IN 
      SELECT DISTINCT orgnr, year 
      FROM public.share_companies 
      WHERE year = p_year 
        AND (p_user_id IS NULL OR user_id = p_user_id OR user_id IS NULL)
    LOOP
      -- Calculate total shares for this company
      SELECT COALESCE(SUM(shares), 0) INTO total_shares_count
      FROM public.share_holdings
      WHERE company_orgnr = company_record.orgnr 
        AND year = company_record.year
        AND (p_user_id IS NULL OR user_id = p_user_id OR user_id IS NULL);
      
      -- Update the share_companies table
      UPDATE public.share_companies
      SET 
        total_shares = total_shares_count
      WHERE orgnr = company_record.orgnr 
        AND year = company_record.year 
        AND (p_user_id IS NULL OR user_id = p_user_id OR user_id IS NULL);
    END LOOP;
  ELSE
    -- Update specific company
    SELECT COALESCE(SUM(shares), 0) INTO total_shares_count
    FROM public.share_holdings
    WHERE company_orgnr = p_orgnr 
      AND year = p_year
      AND (p_user_id IS NULL OR user_id = p_user_id OR user_id IS NULL);
    
    UPDATE public.share_companies
    SET 
      total_shares = total_shares_count
    WHERE orgnr = p_orgnr 
      AND year = p_year 
      AND (p_user_id IS NULL OR user_id = p_user_id OR user_id IS NULL);
  END IF;
END;
$function$;

-- Add optimized batch processing function for large datasets
CREATE OR REPLACE FUNCTION public.update_total_shares_batch_optimized(
    p_year integer, 
    p_user_id uuid DEFAULT NULL, 
    p_batch_size integer DEFAULT 5000, 
    p_offset integer DEFAULT 0,
    p_max_execution_time_seconds integer DEFAULT 120
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  processed_count integer := 0;
  company_record RECORD;
  total_shares_count integer;
  total_companies integer;
  start_time timestamp := clock_timestamp();
  execution_time interval;
BEGIN
  -- Get total count first
  SELECT COUNT(*) INTO total_companies
  FROM public.share_companies 
  WHERE year = p_year 
    AND (p_user_id IS NULL OR user_id = p_user_id OR user_id IS NULL);

  -- Process companies in batch with time limit
  FOR company_record IN 
    SELECT DISTINCT orgnr, year 
    FROM public.share_companies 
    WHERE year = p_year 
      AND (p_user_id IS NULL OR user_id = p_user_id OR user_id IS NULL)
    ORDER BY orgnr
    LIMIT p_batch_size OFFSET p_offset
  LOOP
    -- Check execution time limit
    execution_time := clock_timestamp() - start_time;
    IF EXTRACT(EPOCH FROM execution_time) > p_max_execution_time_seconds THEN
      EXIT; -- Stop processing to avoid timeout
    END IF;

    -- Calculate total shares for this company
    SELECT COALESCE(SUM(shares), 0) INTO total_shares_count
    FROM public.share_holdings
    WHERE company_orgnr = company_record.orgnr 
      AND year = company_record.year
      AND (p_user_id IS NULL OR user_id = p_user_id OR user_id IS NULL);
    
    -- Update the share_companies table
    UPDATE public.share_companies
    SET total_shares = total_shares_count
    WHERE orgnr = company_record.orgnr 
      AND year = company_record.year 
      AND (p_user_id IS NULL OR user_id = p_user_id OR user_id IS NULL);
      
    processed_count := processed_count + 1;
  END LOOP;

  -- Return status with timing information
  execution_time := clock_timestamp() - start_time;
  RETURN jsonb_build_object(
    'processed_count', processed_count,
    'total_companies', total_companies,
    'offset', p_offset,
    'batch_size', p_batch_size,
    'has_more', (p_offset + processed_count) < total_companies,
    'execution_time_seconds', EXTRACT(EPOCH FROM execution_time),
    'next_offset', p_offset + processed_count
  );
END;
$function$;