-- Rename analysis_groups table to main_groups for financial statement sections
ALTER TABLE analysis_groups RENAME TO main_groups;

-- Update the comment for better context
COMMENT ON TABLE main_groups IS 'Main groups/sections for organizing financial statement lines';

-- Update any existing data to have more appropriate names for financial statements
UPDATE main_groups 
SET name = CASE 
  WHEN name ILIKE '%assets%' OR name ILIKE '%eiendel%' THEN 'Eiendeler'
  WHEN name ILIKE '%liabilities%' OR name ILIKE '%gjeld%' THEN 'Gjeld'
  WHEN name ILIKE '%equity%' OR name ILIKE '%egenkapital%' THEN 'Egenkapital'
  WHEN name ILIKE '%revenue%' OR name ILIKE '%inntekt%' THEN 'Inntekter'
  WHEN name ILIKE '%expense%' OR name ILIKE '%kostnad%' THEN 'Kostnader'
  ELSE name
END;

-- Add some default main groups if none exist
INSERT INTO main_groups (name, description, category, is_system_group) 
VALUES 
  ('Eiendeler', 'Eiendeler i balansen', 'balance_sheet', true),
  ('Gjeld', 'Gjeld i balansen', 'balance_sheet', true),
  ('Egenkapital', 'Egenkapital i balansen', 'balance_sheet', true),
  ('Inntekter', 'Inntekter i resultatregnskapet', 'income_statement', true),
  ('Kostnader', 'Kostnader i resultatregnskapet', 'income_statement', true)
ON CONFLICT (name) DO NOTHING;