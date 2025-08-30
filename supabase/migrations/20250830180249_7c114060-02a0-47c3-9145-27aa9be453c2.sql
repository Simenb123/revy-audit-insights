-- Add unique constraints to shareholders tables to fix ON CONFLICT errors

-- share_companies: Each org can only have one entry per year per user
ALTER TABLE public.share_companies 
ADD CONSTRAINT share_companies_unique_orgnr_year_user 
UNIQUE (orgnr, year, user_id);

-- share_holdings: Each holder can only have one holding per company per year per user
ALTER TABLE public.share_holdings 
ADD CONSTRAINT share_holdings_unique_company_holder_year_user 
UNIQUE (company_orgnr, holder_id, year, user_id);

-- share_entities: Each entity should be unique by combination of identifiers
-- For organizations: unique by orgnr and user_id
-- For individuals: unique by name, birth_year, country_code and user_id (when orgnr is null)
ALTER TABLE public.share_entities 
ADD CONSTRAINT share_entities_unique_orgnr_user 
UNIQUE (orgnr, user_id) DEFERRABLE INITIALLY DEFERRED;

-- Additional constraint for individuals without orgnr
ALTER TABLE public.share_entities 
ADD CONSTRAINT share_entities_unique_individual 
UNIQUE (name, birth_year, country_code, user_id, entity_type) DEFERRABLE INITIALLY DEFERRED;