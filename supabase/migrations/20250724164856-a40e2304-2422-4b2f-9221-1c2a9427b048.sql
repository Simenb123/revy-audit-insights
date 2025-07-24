-- Rename analysis_groups table to main_groups for financial statement sections
ALTER TABLE analysis_groups RENAME TO main_groups;

-- Update the name column default for better financial statement context
COMMENT ON TABLE main_groups IS 'Main groups/sections for organizing financial statement lines';

-- Update existing analysis group references to main group references
ALTER TABLE standard_accounts RENAME COLUMN analysis_group_id TO main_group_id;

-- Update the analysis_groups reference in account relationships if it exists
UPDATE account_relationships 
SET metadata = jsonb_set(
  metadata,
  '{type}',
  '"main_group"'::jsonb
)
WHERE relationship_type = 'analysis_group';

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