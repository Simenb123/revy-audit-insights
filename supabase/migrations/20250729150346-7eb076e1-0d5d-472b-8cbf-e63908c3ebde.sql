-- Add accounting year preference to clients table
ALTER TABLE clients 
ADD COLUMN current_accounting_year integer DEFAULT 2024;

-- Add index for better performance on accounting year queries
CREATE INDEX idx_clients_accounting_year 
ON clients(current_accounting_year);

-- Update existing clients to have 2024 as default accounting year
UPDATE clients 
SET current_accounting_year = 2024 
WHERE current_accounting_year IS NULL;