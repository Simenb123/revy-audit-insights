-- Fix integer overflow issues in shareholder tables by using BIGINT for share amounts

-- Update share_holdings table to use BIGINT for shares
ALTER TABLE public.share_holdings 
ALTER COLUMN shares TYPE BIGINT;

-- Update share_companies table to use BIGINT for total_shares and calculated_total
ALTER TABLE public.share_companies 
ALTER COLUMN total_shares TYPE BIGINT,
ALTER COLUMN calculated_total TYPE BIGINT;

-- Update any functions that might have integer overflow issues
-- Replace the problematic batch functions with simpler versions
DROP FUNCTION IF EXISTS public.update_total_shares_batch(integer, uuid, integer, integer);
DROP FUNCTION IF EXISTS public.update_total_shares_batch_optimized(integer, uuid, integer, integer, integer);

-- Create a simpler, safer function for updating total shares
CREATE OR REPLACE FUNCTION public.update_company_total_shares(p_orgnr text, p_year integer, p_user_id uuid DEFAULT NULL)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  total_shares_count BIGINT;
BEGIN
  -- Calculate total shares for the specific company
  SELECT COALESCE(SUM(shares), 0) INTO total_shares_count
  FROM public.share_holdings
  WHERE company_orgnr = p_orgnr 
    AND year = p_year
    AND (p_user_id IS NULL OR user_id = p_user_id OR user_id IS NULL);
  
  -- Update the share_companies table
  UPDATE public.share_companies
  SET total_shares = total_shares_count
  WHERE orgnr = p_orgnr 
    AND year = p_year 
    AND (p_user_id IS NULL OR user_id = p_user_id OR user_id IS NULL);
    
  RETURN total_shares_count;
END;
$function$;