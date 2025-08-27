-- Complete cleanup and proper setup of shareholder import constraints

-- First, drop ALL existing constraints and indexes related to shareholder data
DROP INDEX IF EXISTS public.share_companies_orgnr_year_user_idx;
DROP INDEX IF EXISTS public.share_companies_orgnr_year_global_idx;
DROP INDEX IF EXISTS public.share_entities_with_orgnr_user_idx;
DROP INDEX IF EXISTS public.share_entities_with_orgnr_global_idx;
DROP INDEX IF EXISTS public.share_entities_no_orgnr_user_idx;
DROP INDEX IF EXISTS public.share_entities_no_orgnr_global_idx;
DROP INDEX IF EXISTS public.share_entities_person_user_idx;
DROP INDEX IF EXISTS public.share_entities_person_global_idx;
DROP INDEX IF EXISTS public.share_entities_company_user_idx;
DROP INDEX IF EXISTS public.share_entities_company_global_idx;
DROP INDEX IF EXISTS public.share_holdings_user_idx;
DROP INDEX IF EXISTS public.share_holdings_global_idx;

-- Drop any table constraints that might conflict
ALTER TABLE public.share_companies DROP CONSTRAINT IF EXISTS share_companies_orgnr_year_user_key;
ALTER TABLE public.share_companies DROP CONSTRAINT IF EXISTS share_companies_orgnr_year_global_key;
ALTER TABLE public.share_entities DROP CONSTRAINT IF EXISTS share_entities_name_user_key;
ALTER TABLE public.share_entities DROP CONSTRAINT IF EXISTS share_entities_name_orgnr_user_key;
ALTER TABLE public.share_holdings DROP CONSTRAINT IF EXISTS share_holdings_company_holder_class_year_user_key;

-- Create simple, working unique constraints
-- For share_companies: one entry per orgnr/year/user combination
CREATE UNIQUE INDEX share_companies_unique_idx 
ON public.share_companies (orgnr, year, COALESCE(user_id, '00000000-0000-0000-0000-000000000000'::uuid));

-- For share_entities: prevent duplicates based on entity type
-- Company entities: unique by name + orgnr + user
CREATE UNIQUE INDEX share_entities_company_unique_idx 
ON public.share_entities (name, orgnr, COALESCE(user_id, '00000000-0000-0000-0000-000000000000'::uuid))
WHERE entity_type = 'company';

-- Person entities: unique by name + birth_year + user  
CREATE UNIQUE INDEX share_entities_person_unique_idx 
ON public.share_entities (name, COALESCE(birth_year, 0), COALESCE(user_id, '00000000-0000-0000-0000-000000000000'::uuid))
WHERE entity_type = 'person';

-- For share_holdings: one holding per company/holder/class/year/user
CREATE UNIQUE INDEX share_holdings_unique_idx 
ON public.share_holdings (company_orgnr, holder_id, share_class, year, COALESCE(user_id, '00000000-0000-0000-0000-000000000000'::uuid));