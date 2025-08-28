-- Clean up overlapping unique constraints on shareholder tables
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

-- Delete duplicate share_companies records (keep the first one for each group)
DELETE FROM public.share_companies sc1
WHERE sc1.id NOT IN (
    SELECT MIN(sc2.id)
    FROM public.share_companies sc2
    GROUP BY sc2.orgnr, sc2.year, COALESCE(sc2.user_id, '00000000-0000-0000-0000-000000000000'::uuid)
);

-- Delete duplicate share_entities records for companies (keep the first one)
DELETE FROM public.share_entities se1
WHERE se1.entity_type = 'company'
  AND se1.id NOT IN (
    SELECT MIN(se2.id)
    FROM public.share_entities se2
    WHERE se2.entity_type = 'company'
    GROUP BY se2.name, se2.orgnr, COALESCE(se2.user_id, '00000000-0000-0000-0000-000000000000'::uuid)
);

-- Delete duplicate share_entities records for persons (keep the first one)
DELETE FROM public.share_entities se1
WHERE se1.entity_type = 'person'
  AND se1.id NOT IN (
    SELECT MIN(se2.id)
    FROM public.share_entities se2
    WHERE se2.entity_type = 'person'
    GROUP BY se2.name, COALESCE(se2.birth_year, 0), COALESCE(se2.user_id, '00000000-0000-0000-0000-000000000000'::uuid)
);

-- Delete duplicate share_holdings records (keep the first one)
DELETE FROM public.share_holdings sh1
WHERE sh1.id NOT IN (
    SELECT MIN(sh2.id)
    FROM public.share_holdings sh2
    GROUP BY sh2.company_orgnr, sh2.holder_id, sh2.share_class, sh2.year, COALESCE(sh2.user_id, '00000000-0000-0000-0000-000000000000'::uuid)
);