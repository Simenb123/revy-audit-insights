-- Drop existing constraints that are deferrable and recreate without DEFERRABLE
-- This will allow ON CONFLICT to work properly in the edge function

-- Drop existing constraints on share_entities
ALTER TABLE public.share_entities DROP CONSTRAINT IF EXISTS share_entities_name_birth_year_country_code_user_id_entity_type_key;
ALTER TABLE public.share_entities DROP CONSTRAINT IF EXISTS share_entities_orgnr_user_id_key;

-- Recreate constraints without DEFERRABLE
ALTER TABLE public.share_entities 
ADD CONSTRAINT share_entities_person_unique 
UNIQUE (name, birth_year, country_code, user_id, entity_type);

ALTER TABLE public.share_entities 
ADD CONSTRAINT share_entities_company_unique 
UNIQUE (orgnr, user_id);

-- Also check and fix share_companies constraints if needed
ALTER TABLE public.share_companies DROP CONSTRAINT IF EXISTS share_companies_orgnr_year_user_id_key;
ALTER TABLE public.share_companies 
ADD CONSTRAINT share_companies_unique 
UNIQUE (orgnr, year, user_id);

-- Fix share_holdings constraints if needed
ALTER TABLE public.share_holdings DROP CONSTRAINT IF EXISTS share_holdings_company_orgnr_holder_id_share_class_year_user_key;
ALTER TABLE public.share_holdings 
ADD CONSTRAINT share_holdings_unique 
UNIQUE (company_orgnr, holder_id, share_class, year, user_id);