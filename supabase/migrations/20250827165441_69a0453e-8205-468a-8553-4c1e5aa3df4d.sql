-- Fix the update_total_shares_for_year function to only update total_shares column
-- Remove references to calculated_total which doesn't exist

CREATE OR REPLACE FUNCTION public.update_total_shares_for_year(p_orgnr text, p_year integer, p_user_id uuid DEFAULT NULL::uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  total_shares_count integer;
BEGIN
  -- Calculate total shares for the company/year combination
  SELECT COALESCE(SUM(shares), 0) INTO total_shares_count
  FROM public.share_holdings
  WHERE company_orgnr = p_orgnr 
    AND year = p_year
    AND (p_user_id IS NULL OR user_id = p_user_id OR user_id IS NULL);
  
  -- Update the share_companies table
  UPDATE public.share_companies
  SET 
    total_shares = total_shares_count
  WHERE orgnr = p_orgnr 
    AND year = p_year 
    AND (p_user_id IS NULL OR user_id = p_user_id OR user_id IS NULL);
END;
$function$;

-- Also fix the overloaded version of the function
CREATE OR REPLACE FUNCTION public.update_total_shares_for_year(p_year integer, p_orgnr text DEFAULT NULL::text, p_user_id uuid DEFAULT NULL::uuid)
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