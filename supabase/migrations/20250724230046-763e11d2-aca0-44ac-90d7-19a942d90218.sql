-- Add ON DELETE CASCADE to foreign key constraints referencing subject_areas

-- First, drop existing foreign key constraints
ALTER TABLE audit_action_templates DROP CONSTRAINT IF EXISTS audit_action_templates_subject_area_id_fkey;
ALTER TABLE client_audit_actions DROP CONSTRAINT IF EXISTS client_audit_actions_subject_area_id_fkey;
ALTER TABLE action_groups DROP CONSTRAINT IF EXISTS action_groups_subject_area_id_fkey;
ALTER TABLE subject_areas DROP CONSTRAINT IF EXISTS subject_areas_parent_subject_area_id_fkey;

-- Add them back with ON DELETE CASCADE
ALTER TABLE audit_action_templates 
ADD CONSTRAINT audit_action_templates_subject_area_id_fkey 
FOREIGN KEY (subject_area_id) REFERENCES subject_areas(id) ON DELETE CASCADE;

ALTER TABLE client_audit_actions 
ADD CONSTRAINT client_audit_actions_subject_area_id_fkey 
FOREIGN KEY (subject_area_id) REFERENCES subject_areas(id) ON DELETE CASCADE;

ALTER TABLE action_groups 
ADD CONSTRAINT action_groups_subject_area_id_fkey 
FOREIGN KEY (subject_area_id) REFERENCES subject_areas(id) ON DELETE CASCADE;

-- For hierarchical relationships, use CASCADE to automatically delete child subject areas
ALTER TABLE subject_areas 
ADD CONSTRAINT subject_areas_parent_subject_area_id_fkey 
FOREIGN KEY (parent_subject_area_id) REFERENCES subject_areas(id) ON DELETE CASCADE;