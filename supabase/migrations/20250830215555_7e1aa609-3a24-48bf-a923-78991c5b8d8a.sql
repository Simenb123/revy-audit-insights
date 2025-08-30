-- Fix the deferrable constraints that are causing ON CONFLICT issues
-- Drop and recreate unique constraints without DEFERRABLE

-- For share_entities table
ALTER TABLE public.share_entities DROP CONSTRAINT IF EXISTS unique_share_entities_company;
ALTER TABLE public.share_entities DROP CONSTRAINT IF EXISTS unique_share_entities_person;

-- Recreate constraints without DEFERRABLE  
ALTER TABLE public.share_entities ADD CONSTRAINT unique_share_entities_company 
UNIQUE (orgnr, user_id) WHERE entity_type = 'company';

ALTER TABLE public.share_entities ADD CONSTRAINT unique_share_entities_person 
UNIQUE (name, birth_year, country_code, user_id, entity_type) WHERE entity_type = 'person';

-- For share_holdings table
ALTER TABLE public.share_holdings DROP CONSTRAINT IF EXISTS share_holdings_company_orgnr_holder_id_share_class_year_user_key;

-- Recreate constraint without DEFERRABLE
ALTER TABLE public.share_holdings ADD CONSTRAINT share_holdings_unique_key 
UNIQUE (company_orgnr, holder_id, share_class, year, user_id);