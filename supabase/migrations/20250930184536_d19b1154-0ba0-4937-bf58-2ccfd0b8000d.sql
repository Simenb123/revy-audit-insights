
-- Remove the incorrect unique constraint that blocks same company across years
-- We need to allow same orgnr for different years
ALTER TABLE share_companies 
DROP CONSTRAINT IF EXISTS unique_company_orgnr_user;

-- Also make sure we have the correct constraint (should already exist)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'share_companies_orgnr_year_user_unique'
  ) THEN
    ALTER TABLE share_companies 
    ADD CONSTRAINT share_companies_orgnr_year_user_unique 
    UNIQUE (orgnr, year, user_id);
  END IF;
END $$;
