-- Drop existing indexes if they exist and create correct unique constraints for shareholder import

-- Drop existing indexes if they exist
DROP INDEX IF EXISTS public.share_companies_orgnr_year_user_idx;
DROP INDEX IF EXISTS public.share_companies_orgnr_year_global_idx;
DROP INDEX IF EXISTS public.share_entities_with_orgnr_user_idx;
DROP INDEX IF EXISTS public.share_entities_with_orgnr_global_idx;
DROP INDEX IF EXISTS public.share_entities_no_orgnr_user_idx;
DROP INDEX IF EXISTS public.share_entities_no_orgnr_global_idx;
DROP INDEX IF EXISTS public.share_holdings_user_idx;  
DROP INDEX IF EXISTS public.share_holdings_global_idx;

-- Create simple unique constraints that the edge function expects
-- For share_companies: allow same company to exist globally and per user
CREATE UNIQUE INDEX share_companies_orgnr_year_user_idx 
ON public.share_companies (orgnr, year, user_id) 
WHERE user_id IS NOT NULL;

CREATE UNIQUE INDEX share_companies_orgnr_year_global_idx 
ON public.share_companies (orgnr, year) 
WHERE user_id IS NULL;

-- For share_entities: handle entity uniqueness
CREATE UNIQUE INDEX share_entities_person_user_idx 
ON public.share_entities (name, birth_year, user_id) 
WHERE entity_type = 'person' AND user_id IS NOT NULL;

CREATE UNIQUE INDEX share_entities_person_global_idx 
ON public.share_entities (name, birth_year) 
WHERE entity_type = 'person' AND user_id IS NULL;

CREATE UNIQUE INDEX share_entities_company_user_idx 
ON public.share_entities (name, orgnr, user_id) 
WHERE entity_type = 'company' AND user_id IS NOT NULL;

CREATE UNIQUE INDEX share_entities_company_global_idx 
ON public.share_entities (name, orgnr) 
WHERE entity_type = 'company' AND user_id IS NULL;

-- For share_holdings: prevent duplicate holdings
CREATE UNIQUE INDEX share_holdings_user_idx 
ON public.share_holdings (company_orgnr, holder_id, share_class, year, user_id) 
WHERE user_id IS NOT NULL;

CREATE UNIQUE INDEX share_holdings_global_idx 
ON public.share_holdings (company_orgnr, holder_id, share_class, year) 
WHERE user_id IS NULL;