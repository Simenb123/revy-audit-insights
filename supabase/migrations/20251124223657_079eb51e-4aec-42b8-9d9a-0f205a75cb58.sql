-- Convert audit_action_templates.subject_area from ENUM to TEXT
-- This allows dynamic subject areas from the subject_areas table

ALTER TABLE audit_action_templates 
  ALTER COLUMN subject_area TYPE TEXT;

-- Add comment to document the change
COMMENT ON COLUMN audit_action_templates.subject_area IS 'Legacy text field for backward compatibility. Use subject_area_id for new implementations.';