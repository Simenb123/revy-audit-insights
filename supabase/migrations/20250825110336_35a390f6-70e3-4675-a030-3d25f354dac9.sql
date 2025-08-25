-- Create missing update_total_shares_for_year function
CREATE OR REPLACE FUNCTION public.update_total_shares_for_year(
  p_orgnr text,
  p_year integer,
  p_user_id uuid DEFAULT NULL
)
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
    total_shares = total_shares_count,
    calculated_total = total_shares_count
  WHERE orgnr = p_orgnr 
    AND year = p_year 
    AND (p_user_id IS NULL OR user_id = p_user_id OR user_id IS NULL);
END;
$function$;

-- Drop existing unique constraints that don't handle NULL user_id properly
DROP INDEX IF EXISTS share_companies_orgnr_year_user_key;
DROP INDEX IF EXISTS share_entities_orgnr_user_key;
DROP INDEX IF EXISTS share_entities_name_birth_year_user_key;
DROP INDEX IF EXISTS share_holdings_company_holder_class_year_user_key;

-- Create proper unique constraints that handle NULL user_id values correctly
-- For share_companies: unique per (orgnr, year) globally, but users can have their own versions
CREATE UNIQUE INDEX share_companies_orgnr_year_global_key 
ON public.share_companies (orgnr, year) 
WHERE user_id IS NULL;

CREATE UNIQUE INDEX share_companies_orgnr_year_user_key 
ON public.share_companies (orgnr, year, user_id) 
WHERE user_id IS NOT NULL;

-- For share_entities: unique per orgnr globally, but users can have their own versions
CREATE UNIQUE INDEX share_entities_orgnr_global_key 
ON public.share_entities (orgnr) 
WHERE user_id IS NULL AND orgnr IS NOT NULL;

CREATE UNIQUE INDEX share_entities_orgnr_user_key 
ON public.share_entities (orgnr, user_id) 
WHERE user_id IS NOT NULL AND orgnr IS NOT NULL;

-- For share_entities: unique per (name, birth_year) for persons globally
CREATE UNIQUE INDEX share_entities_name_birth_year_global_key 
ON public.share_entities (name, birth_year) 
WHERE user_id IS NULL AND entity_type = 'person' AND birth_year IS NOT NULL;

CREATE UNIQUE INDEX share_entities_name_birth_year_user_key 
ON public.share_entities (name, birth_year, user_id) 
WHERE user_id IS NOT NULL AND entity_type = 'person' AND birth_year IS NOT NULL;

-- For share_holdings: unique per (company_orgnr, holder_id, share_class, year)
CREATE UNIQUE INDEX share_holdings_company_holder_class_year_global_key 
ON public.share_holdings (company_orgnr, holder_id, share_class, year) 
WHERE user_id IS NULL;

CREATE UNIQUE INDEX share_holdings_company_holder_class_year_user_key 
ON public.share_holdings (company_orgnr, holder_id, share_class, year, user_id) 
WHERE user_id IS NOT NULL;