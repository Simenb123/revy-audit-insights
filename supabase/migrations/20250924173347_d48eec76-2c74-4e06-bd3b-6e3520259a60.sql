-- Fix duplicate unique constraints for shareholder tables

-- First, check existing constraints
SELECT conname, contype, pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conrelid IN (
  SELECT oid FROM pg_class WHERE relname IN ('share_companies', 'share_entities', 'share_holdings')
) AND contype = 'u';

-- Drop all existing unique constraints for these tables
-- share_companies constraints
DO $$ 
DECLARE
    constraint_name TEXT;
BEGIN
    FOR constraint_name IN 
        SELECT conname 
        FROM pg_constraint c
        JOIN pg_class t ON c.conrelid = t.oid
        WHERE t.relname = 'share_companies' AND c.contype = 'u'
    LOOP
        EXECUTE 'ALTER TABLE share_companies DROP CONSTRAINT IF EXISTS ' || constraint_name;
    END LOOP;
END $$;

-- share_entities constraints  
DO $$ 
DECLARE
    constraint_name TEXT;
BEGIN
    FOR constraint_name IN 
        SELECT conname 
        FROM pg_constraint c
        JOIN pg_class t ON c.conrelid = t.oid
        WHERE t.relname = 'share_entities' AND c.contype = 'u'
    LOOP
        EXECUTE 'ALTER TABLE share_entities DROP CONSTRAINT IF EXISTS ' || constraint_name;
    END LOOP;
END $$;

-- share_holdings constraints
DO $$ 
DECLARE
    constraint_name TEXT;
BEGIN
    FOR constraint_name IN 
        SELECT conname 
        FROM pg_constraint c
        JOIN pg_class t ON c.conrelid = t.oid
        WHERE t.relname = 'share_holdings' AND c.contype = 'u'
    LOOP
        EXECUTE 'ALTER TABLE share_holdings DROP CONSTRAINT IF EXISTS ' || constraint_name;
    END LOOP;
END $$;

-- Create the correct unique constraints that match our ON CONFLICT clauses

-- For share_companies: (orgnr, year, user_id)
ALTER TABLE share_companies 
ADD CONSTRAINT share_companies_orgnr_year_user_unique 
UNIQUE (orgnr, year, user_id);

-- For share_entities: Two different constraints for person vs company
-- Person entities: (name, birth_year, country_code, user_id, entity_type)  
ALTER TABLE share_entities 
ADD CONSTRAINT share_entities_person_unique 
UNIQUE (name, birth_year, country_code, user_id, entity_type);

-- Company entities: (orgnr, user_id) - but only for companies with orgnr
ALTER TABLE share_entities 
ADD CONSTRAINT share_entities_company_unique 
UNIQUE (orgnr, user_id);

-- For share_holdings: (company_orgnr, holder_id, share_class, year, user_id)
ALTER TABLE share_holdings 
ADD CONSTRAINT share_holdings_complete_unique 
UNIQUE (company_orgnr, holder_id, share_class, year, user_id);

-- Verify the new constraints
SELECT 
    t.relname as table_name,
    c.conname as constraint_name,
    pg_get_constraintdef(c.oid) as definition
FROM pg_constraint c
JOIN pg_class t ON c.conrelid = t.oid
WHERE t.relname IN ('share_companies', 'share_entities', 'share_holdings')
  AND c.contype = 'u'
ORDER BY t.relname, c.conname;