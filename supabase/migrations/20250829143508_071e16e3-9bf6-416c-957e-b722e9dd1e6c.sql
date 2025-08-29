-- Optimized batch processing function for updating total shares
CREATE OR REPLACE FUNCTION public.update_total_shares_batch(
  p_year integer,
  p_user_id uuid DEFAULT NULL,
  p_batch_size integer DEFAULT 1000,
  p_offset integer DEFAULT 0
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  processed_count integer := 0;
  company_record RECORD;
  total_shares_count integer;
  total_companies integer;
BEGIN
  -- Get total count first
  SELECT COUNT(*) INTO total_companies
  FROM public.share_companies 
  WHERE year = p_year 
    AND (p_user_id IS NULL OR user_id = p_user_id OR user_id IS NULL);

  -- Process companies in batch
  FOR company_record IN 
    SELECT DISTINCT orgnr, year 
    FROM public.share_companies 
    WHERE year = p_year 
      AND (p_user_id IS NULL OR user_id = p_user_id OR user_id IS NULL)
    ORDER BY orgnr
    LIMIT p_batch_size OFFSET p_offset
  LOOP
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

  -- Return status
  RETURN jsonb_build_object(
    'processed_count', processed_count,
    'total_companies', total_companies,
    'offset', p_offset,
    'batch_size', p_batch_size,
    'has_more', (p_offset + processed_count) < total_companies
  );
END;
$function$;

-- Recovery function to check import session status
CREATE OR REPLACE FUNCTION public.get_import_session_status(
  p_session_id text,
  p_year integer,
  p_user_id uuid DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  companies_count integer := 0;
  holdings_count integer := 0;
  entities_count integer := 0;
  needs_aggregation boolean := false;
BEGIN
  -- Count imported data
  SELECT COUNT(*) INTO companies_count
  FROM public.share_companies 
  WHERE year = p_year 
    AND (p_user_id IS NULL OR user_id = p_user_id OR user_id IS NULL);

  SELECT COUNT(*) INTO holdings_count
  FROM public.share_holdings 
  WHERE year = p_year 
    AND (p_user_id IS NULL OR user_id = p_user_id OR user_id IS NULL);

  SELECT COUNT(*) INTO entities_count
  FROM public.share_entities 
  WHERE (p_user_id IS NULL OR user_id = p_user_id OR user_id IS NULL);

  -- Check if aggregation is needed (companies with zero total_shares)
  SELECT EXISTS(
    SELECT 1 FROM public.share_companies 
    WHERE year = p_year 
      AND (p_user_id IS NULL OR user_id = p_user_id OR user_id IS NULL)
      AND (total_shares = 0 OR total_shares IS NULL)
  ) INTO needs_aggregation;

  RETURN jsonb_build_object(
    'session_id', p_session_id,
    'companies_count', companies_count,
    'holdings_count', holdings_count,
    'entities_count', entities_count,
    'needs_aggregation', needs_aggregation,
    'year', p_year
  );
END;
$function$;