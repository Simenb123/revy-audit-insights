-- Add response_fields column to audit_action_templates for dynamic input field definitions
ALTER TABLE audit_action_templates 
ADD COLUMN IF NOT EXISTS response_fields JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN audit_action_templates.response_fields IS 'Dynamic field definitions for auditor responses. Structure: [{id, label, type, required, placeholder, options}]';
