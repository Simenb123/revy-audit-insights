-- Add version column to trial_balances table for versioning support
ALTER TABLE trial_balances 
ADD COLUMN version text DEFAULT 'v1';

-- Update the unique constraint to include version for proper versioning
ALTER TABLE trial_balances 
DROP CONSTRAINT IF EXISTS trial_balances_client_id_client_account_id_period_end_date_key;

-- Add new composite unique constraint including version
ALTER TABLE trial_balances 
ADD CONSTRAINT trial_balances_unique_version 
UNIQUE (client_id, client_account_id, period_end_date, version);

-- Create index for better performance on version queries
CREATE INDEX IF NOT EXISTS idx_trial_balances_version 
ON trial_balances(client_id, period_year, version);

-- Add check constraint to ensure valid version format
ALTER TABLE trial_balances 
ADD CONSTRAINT trial_balances_version_format 
CHECK (version ~ '^v[1-9][0-9]*$');