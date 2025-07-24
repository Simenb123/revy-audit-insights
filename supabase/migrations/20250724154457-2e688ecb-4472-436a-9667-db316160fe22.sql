-- Update calculation_formula to support structured JSON formulas
ALTER TABLE standard_accounts 
ALTER COLUMN calculation_formula TYPE jsonb USING 
  CASE 
    WHEN calculation_formula IS NULL THEN NULL
    WHEN calculation_formula = '' THEN NULL
    ELSE jsonb_build_object('type', 'legacy', 'formula', calculation_formula)
  END;

-- Add comment to clarify the new structure
COMMENT ON COLUMN standard_accounts.calculation_formula IS 'Structured formula as JSON. Format: {"type": "formula", "terms": [{"account": "10", "operator": "+", "value": "15"}]} or {"type": "legacy", "formula": "text"}';