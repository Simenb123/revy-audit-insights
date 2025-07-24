-- Update account types to Norwegian values
-- First, update the enum type to include both old and new values temporarily
ALTER TYPE account_type_enum ADD VALUE IF NOT EXISTS 'eiendeler';
ALTER TYPE account_type_enum ADD VALUE IF NOT EXISTS 'egenkapital';
ALTER TYPE account_type_enum ADD VALUE IF NOT EXISTS 'gjeld';
ALTER TYPE account_type_enum ADD VALUE IF NOT EXISTS 'resultat';

-- Update existing data to new Norwegian values
UPDATE standard_accounts SET account_type = 'eiendeler' WHERE account_type = 'asset';
UPDATE standard_accounts SET account_type = 'egenkapital' WHERE account_type = 'equity';
UPDATE standard_accounts SET account_type = 'gjeld' WHERE account_type = 'liability';
UPDATE standard_accounts SET account_type = 'resultat' WHERE account_type IN ('revenue', 'expense');

-- Update client chart of accounts if any exist
UPDATE client_chart_of_accounts SET account_type = 'eiendeler' WHERE account_type = 'asset';
UPDATE client_chart_of_accounts SET account_type = 'egenkapital' WHERE account_type = 'equity';
UPDATE client_chart_of_accounts SET account_type = 'gjeld' WHERE account_type = 'liability';
UPDATE client_chart_of_accounts SET account_type = 'resultat' WHERE account_type IN ('revenue', 'expense');

-- Simplify analysis_group to Norwegian values
UPDATE standard_accounts SET analysis_group = 'Balanse' WHERE analysis_group IN ('balance_sheet', 'equity');
UPDATE standard_accounts SET analysis_group = 'Resultat' WHERE analysis_group = 'income_statement';

-- Drop and recreate the enum with only Norwegian values
ALTER TABLE standard_accounts ALTER COLUMN account_type TYPE text;
ALTER TABLE client_chart_of_accounts ALTER COLUMN account_type TYPE text;
DROP TYPE account_type_enum;
CREATE TYPE account_type_enum AS ENUM ('eiendeler', 'gjeld', 'egenkapital', 'resultat');
ALTER TABLE standard_accounts ALTER COLUMN account_type TYPE account_type_enum USING account_type::account_type_enum;
ALTER TABLE client_chart_of_accounts ALTER COLUMN account_type TYPE account_type_enum USING account_type::account_type_enum;