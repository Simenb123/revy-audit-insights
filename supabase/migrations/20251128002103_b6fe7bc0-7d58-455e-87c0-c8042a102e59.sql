-- Add configuration fields for comment and team comments to audit_action_templates
ALTER TABLE audit_action_templates 
ADD COLUMN include_comment_field boolean DEFAULT true,
ADD COLUMN show_team_comments boolean DEFAULT true;

COMMENT ON COLUMN audit_action_templates.include_comment_field IS 'Auto-includes a standard comment textarea field in the action response';
COMMENT ON COLUMN audit_action_templates.show_team_comments IS 'Shows/hides the ActionComments section for team discussions';