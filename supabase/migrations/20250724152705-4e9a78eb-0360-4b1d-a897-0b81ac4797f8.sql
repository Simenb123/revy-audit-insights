-- Fix display_order for standard accounts based on standard_number
UPDATE standard_accounts 
SET display_order = CAST(standard_number AS INTEGER)
WHERE standard_number ~ '^[0-9]+$';

-- For non-numeric standard numbers, set a high display_order to put them at the end
UPDATE standard_accounts 
SET display_order = 9999
WHERE NOT (standard_number ~ '^[0-9]+$');