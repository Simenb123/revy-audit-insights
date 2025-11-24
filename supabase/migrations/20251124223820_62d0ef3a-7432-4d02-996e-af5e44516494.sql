-- Convert client_audit_actions.subject_area from ENUM to TEXT
-- This allows dynamic subject areas from the subject_areas table

ALTER TABLE client_audit_actions 
  ALTER COLUMN subject_area TYPE TEXT;

-- Add comment to document the change
COMMENT ON COLUMN client_audit_actions.subject_area IS 'Legacy text field for backward compatibility. Use subject_area_id for new implementations.';