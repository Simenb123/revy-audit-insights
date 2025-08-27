-- Add missing unique constraints for shareholder import upserts using partial indexes

-- Unique constraint for share_companies (orgnr, year, user_id)
-- Handle NULL user_id with separate partial indexes
CREATE UNIQUE INDEX share_companies_orgnr_year_user_idx 
ON public.share_companies (orgnr, year, user_id) 
WHERE user_id IS NOT NULL;

CREATE UNIQUE INDEX share_companies_orgnr_year_global_idx 
ON public.share_companies (orgnr, year) 
WHERE user_id IS NULL;

-- Unique constraint for share_entities 
-- Handle NULLs in orgnr, birth_year, user_id with partial indexes
CREATE UNIQUE INDEX share_entities_with_orgnr_user_idx 
ON public.share_entities (entity_type, name, orgnr, birth_year, user_id) 
WHERE orgnr IS NOT NULL AND birth_year IS NOT NULL AND user_id IS NOT NULL;

CREATE UNIQUE INDEX share_entities_with_orgnr_global_idx 
ON public.share_entities (entity_type, name, orgnr, birth_year) 
WHERE orgnr IS NOT NULL AND birth_year IS NOT NULL AND user_id IS NULL;

CREATE UNIQUE INDEX share_entities_no_orgnr_user_idx 
ON public.share_entities (entity_type, name, birth_year, user_id) 
WHERE orgnr IS NULL AND birth_year IS NOT NULL AND user_id IS NOT NULL;

CREATE UNIQUE INDEX share_entities_no_orgnr_global_idx 
ON public.share_entities (entity_type, name, birth_year) 
WHERE orgnr IS NULL AND birth_year IS NOT NULL AND user_id IS NULL;

-- Unique constraint for share_holdings
CREATE UNIQUE INDEX share_holdings_user_idx 
ON public.share_holdings (company_orgnr, holder_id, share_class, year, user_id) 
WHERE user_id IS NOT NULL;

CREATE UNIQUE INDEX share_holdings_global_idx 
ON public.share_holdings (company_orgnr, holder_id, share_class, year) 
WHERE user_id IS NULL;