-- Add period_start_date column to trial_balances table for period range support
ALTER TABLE trial_balances 
ADD COLUMN period_start_date date;

-- Set default period_start_date for existing records (January 1st of the period_year)
UPDATE trial_balances 
SET period_start_date = MAKE_DATE(period_year, 1, 1)
WHERE period_start_date IS NULL;

-- Make period_start_date NOT NULL after setting defaults
ALTER TABLE trial_balances 
ALTER COLUMN period_start_date SET NOT NULL;

-- Update the unique constraint to include period_start_date for proper period range versioning
ALTER TABLE trial_balances 
DROP CONSTRAINT IF EXISTS trial_balances_unique_version;

-- Add new composite unique constraint including period_start_date
ALTER TABLE trial_balances 
ADD CONSTRAINT trial_balances_unique_period_version 
UNIQUE (client_id, client_account_id, period_start_date, period_end_date, version);

-- Update index for better performance on period range queries
DROP INDEX IF EXISTS idx_trial_balances_version;
CREATE INDEX idx_trial_balances_period_version 
ON trial_balances(client_id, period_start_date, period_end_date, version);

-- Add check constraint to ensure period_start_date is before period_end_date
ALTER TABLE trial_balances 
ADD CONSTRAINT trial_balances_valid_period_range 
CHECK (period_start_date <= period_end_date);