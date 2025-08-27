-- Add missing unique constraints for shareholder import upserts

-- Unique constraint for share_companies (orgnr, year, user_id)
-- This allows the same company to exist globally (user_id = NULL) and for specific users
ALTER TABLE public.share_companies 
ADD CONSTRAINT share_companies_orgnr_year_user_unique 
UNIQUE (orgnr, year, COALESCE(user_id, '00000000-0000-0000-0000-000000000000'::uuid));

-- Unique constraint for share_entities 
-- This prevents duplicate entities with same identifiers
ALTER TABLE public.share_entities 
ADD CONSTRAINT share_entities_unique 
UNIQUE (entity_type, name, COALESCE(orgnr, ''), COALESCE(birth_year, 0), COALESCE(user_id, '00000000-0000-0000-0000-000000000000'::uuid));

-- Unique constraint for share_holdings
-- This prevents duplicate holdings for the same company/holder/class combination
ALTER TABLE public.share_holdings 
ADD CONSTRAINT share_holdings_unique 
UNIQUE (company_orgnr, holder_id, share_class, year, COALESCE(user_id, '00000000-0000-0000-0000-000000000000'::uuid));