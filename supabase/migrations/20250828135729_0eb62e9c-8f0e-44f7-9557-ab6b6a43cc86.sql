-- Clean up overlapping unique constraints on shareholder tables (Fixed version)
-- This migration removes redundant constraints that are causing import conflicts

-- Step 1: Remove redundant constraints on share_companies table
-- Keep only: share_companies_orgnr_year_global_key and share_companies_orgnr_year_user_key
DROP INDEX IF EXISTS public.share_companies_unique_idx;
DROP INDEX IF EXISTS public.unique_share_companies_orgnr_year_user;

-- Step 2: Remove redundant constraints on share_entities table  
-- Keep only the global/user specific constraints for orgnr and name/birth_year
DROP INDEX IF EXISTS public.share_entities_name_user_idx;
DROP INDEX IF EXISTS public.share_entities_company_unique_idx;
DROP INDEX IF EXISTS public.share_entities_person_unique_idx;
DROP INDEX IF EXISTS public.unique_share_entities_key_user;

-- Step 3: Remove redundant constraints on share_holdings table
-- Keep only the global/user specific constraints
DROP INDEX IF EXISTS public.share_holdings_unique_idx;
DROP INDEX IF EXISTS public.unique_share_holdings_company_holder_year_user;

-- Step 4: Clean up any existing duplicate records
-- This will help prevent future constraint violations

-- Clean up duplicate share_companies records using ROW_NUMBER approach
WITH duplicates AS (
    SELECT id,
           ROW_NUMBER() OVER (
               PARTITION BY orgnr, year, COALESCE(user_id, '00000000-0000-0000-0000-000000000000'::uuid)
               ORDER BY created_at ASC
           ) as rn
    FROM public.share_companies
)
DELETE FROM public.share_companies 
WHERE id IN (
    SELECT id FROM duplicates WHERE rn > 1
);

-- Clean up duplicate share_entities records for companies
WITH company_duplicates AS (
    SELECT id,
           ROW_NUMBER() OVER (
               PARTITION BY name, orgnr, COALESCE(user_id, '00000000-0000-0000-0000-000000000000'::uuid)
               ORDER BY created_at ASC
           ) as rn
    FROM public.share_entities
    WHERE entity_type = 'company'
)
DELETE FROM public.share_entities 
WHERE id IN (
    SELECT id FROM company_duplicates WHERE rn > 1
);

-- Clean up duplicate share_entities records for persons
WITH person_duplicates AS (
    SELECT id,
           ROW_NUMBER() OVER (
               PARTITION BY name, COALESCE(birth_year, 0), COALESCE(user_id, '00000000-0000-0000-0000-000000000000'::uuid)
               ORDER BY created_at ASC
           ) as rn
    FROM public.share_entities
    WHERE entity_type = 'person'
)
DELETE FROM public.share_entities 
WHERE id IN (
    SELECT id FROM person_duplicates WHERE rn > 1
);

-- Clean up duplicate share_holdings records
WITH holdings_duplicates AS (
    SELECT id,
           ROW_NUMBER() OVER (
               PARTITION BY company_orgnr, holder_id, share_class, year, COALESCE(user_id, '00000000-0000-0000-0000-000000000000'::uuid)
               ORDER BY created_at ASC
           ) as rn
    FROM public.share_holdings
)
DELETE FROM public.share_holdings 
WHERE id IN (
    SELECT id FROM holdings_duplicates WHERE rn > 1
);