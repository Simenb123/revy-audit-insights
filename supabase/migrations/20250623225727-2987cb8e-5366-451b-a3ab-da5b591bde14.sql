
-- Add parent_subject_area_id column for hierarchical structure
ALTER TABLE public.subject_areas 
ADD COLUMN parent_subject_area_id UUID REFERENCES public.subject_areas(id);

-- Create some hierarchical subject area data
INSERT INTO public.subject_areas (name, display_name, description, icon, color, sort_order, is_active) VALUES
-- Main categories
('accounting', 'Regnskap', 'Regnskapsrelaterte emner', '📊', '#3B82F6', 1, true),
('auditing', 'Revisjon', 'Revisjonsrelaterte emner', '🔍', '#10B981', 2, true),
('taxation', 'Skatt', 'Skatterelaterte emner', '💰', '#F59E0B', 3, true),
('legal', 'Juss', 'Juridiske emner', '⚖️', '#8B5CF6', 4, true),
('finance', 'Finans', 'Finansielle emner', '🏦', '#EF4444', 5, true)
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  color = EXCLUDED.color,
  sort_order = EXCLUDED.sort_order;

-- Add subcategories with parent references
INSERT INTO public.subject_areas (name, display_name, description, icon, color, sort_order, is_active, parent_subject_area_id) VALUES
-- Accounting subcategories
('sales_accounting', 'Salgsregnskap', 'Registrering og håndtering av salg', '💳', '#3B82F6', 11, true, 
  (SELECT id FROM public.subject_areas WHERE name = 'accounting')),
('payroll_accounting', 'Lønnsregnskap', 'Lønn og personaladministrasjon', '👥', '#3B82F6', 12, true,
  (SELECT id FROM public.subject_areas WHERE name = 'accounting')),
('inventory_accounting', 'Lagerregnskap', 'Håndtering av varelager', '📦', '#3B82F6', 13, true,
  (SELECT id FROM public.subject_areas WHERE name = 'accounting')),

-- Auditing subcategories  
('planning_audit', 'Planlegging', 'Revisjonsplanlegging og risikovurdering', '📋', '#10B981', 21, true,
  (SELECT id FROM public.subject_areas WHERE name = 'auditing')),
('execution_audit', 'Gjennomføring', 'Revisjonshandlinger og testing', '⚡', '#10B981', 22, true,
  (SELECT id FROM public.subject_areas WHERE name = 'auditing')),
('reporting_audit', 'Rapportering', 'Revisjonsrapport og konklusjoner', '📄', '#10B981', 23, true,
  (SELECT id FROM public.subject_areas WHERE name = 'auditing')),

-- Taxation subcategories
('corporate_tax', 'Selskapsskatt', 'Skatt for selskaper', '🏢', '#F59E0B', 31, true,
  (SELECT id FROM public.subject_areas WHERE name = 'taxation')),
('personal_tax', 'Personskatt', 'Skatt for privatpersoner', '👤', '#F59E0B', 32, true,
  (SELECT id FROM public.subject_areas WHERE name = 'taxation')),
('vat', 'Merverdiavgift', 'MVA-håndtering', '🧾', '#F59E0B', 33, true,
  (SELECT id FROM public.subject_areas WHERE name = 'taxation'))
ON CONFLICT (name) DO UPDATE SET
  parent_subject_area_id = EXCLUDED.parent_subject_area_id,
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description;

-- Update existing action_groups to use UUID references instead of ENUM
ALTER TABLE public.action_groups 
DROP CONSTRAINT IF EXISTS action_groups_subject_area_check,
ADD COLUMN subject_area_id UUID REFERENCES public.subject_areas(id);

-- Migrate existing ENUM values to UUID references
UPDATE public.action_groups 
SET subject_area_id = (
  CASE subject_area::text
    WHEN 'sales' THEN (SELECT id FROM public.subject_areas WHERE name = 'sales_accounting')
    WHEN 'payroll' THEN (SELECT id FROM public.subject_areas WHERE name = 'payroll_accounting')
    WHEN 'operating_expenses' THEN (SELECT id FROM public.subject_areas WHERE name = 'accounting')
    WHEN 'inventory' THEN (SELECT id FROM public.subject_areas WHERE name = 'inventory_accounting')
    WHEN 'finance' THEN (SELECT id FROM public.subject_areas WHERE name = 'finance')
    WHEN 'banking' THEN (SELECT id FROM public.subject_areas WHERE name = 'finance')
    WHEN 'fixed_assets' THEN (SELECT id FROM public.subject_areas WHERE name = 'accounting')
    WHEN 'receivables' THEN (SELECT id FROM public.subject_areas WHERE name = 'sales_accounting')
    WHEN 'payables' THEN (SELECT id FROM public.subject_areas WHERE name = 'accounting')
    WHEN 'equity' THEN (SELECT id FROM public.subject_areas WHERE name = 'finance')
    WHEN 'other' THEN (SELECT id FROM public.subject_areas WHERE name = 'accounting')
    ELSE (SELECT id FROM public.subject_areas WHERE name = 'accounting')
  END
);

-- Update audit_action_templates table
ALTER TABLE public.audit_action_templates
DROP CONSTRAINT IF EXISTS audit_action_templates_subject_area_check,
ADD COLUMN subject_area_id UUID REFERENCES public.subject_areas(id);

-- Migrate existing ENUM values for audit_action_templates
UPDATE public.audit_action_templates 
SET subject_area_id = (
  CASE subject_area::text
    WHEN 'sales' THEN (SELECT id FROM public.subject_areas WHERE name = 'sales_accounting')
    WHEN 'payroll' THEN (SELECT id FROM public.subject_areas WHERE name = 'payroll_accounting')
    WHEN 'operating_expenses' THEN (SELECT id FROM public.subject_areas WHERE name = 'accounting')
    WHEN 'inventory' THEN (SELECT id FROM public.subject_areas WHERE name = 'inventory_accounting')
    WHEN 'finance' THEN (SELECT id FROM public.subject_areas WHERE name = 'finance')
    WHEN 'banking' THEN (SELECT id FROM public.subject_areas WHERE name = 'finance')
    WHEN 'fixed_assets' THEN (SELECT id FROM public.subject_areas WHERE name = 'accounting')
    WHEN 'receivables' THEN (SELECT id FROM public.subject_areas WHERE name = 'sales_accounting')
    WHEN 'payables' THEN (SELECT id FROM public.subject_areas WHERE name = 'accounting')
    WHEN 'equity' THEN (SELECT id FROM public.subject_areas WHERE name = 'finance')
    WHEN 'other' THEN (SELECT id FROM public.subject_areas WHERE name = 'accounting')
    ELSE (SELECT id FROM public.subject_areas WHERE name = 'accounting')
  END
);

-- Update client_audit_actions table
ALTER TABLE public.client_audit_actions
DROP CONSTRAINT IF EXISTS client_audit_actions_subject_area_check,
ADD COLUMN subject_area_id UUID REFERENCES public.subject_areas(id);

-- Migrate existing ENUM values for client_audit_actions
UPDATE public.client_audit_actions 
SET subject_area_id = (
  CASE subject_area::text
    WHEN 'sales' THEN (SELECT id FROM public.subject_areas WHERE name = 'sales_accounting')
    WHEN 'payroll' THEN (SELECT id FROM public.subject_areas WHERE name = 'payroll_accounting')
    WHEN 'operating_expenses' THEN (SELECT id FROM public.subject_areas WHERE name = 'accounting')
    WHEN 'inventory' THEN (SELECT id FROM public.subject_areas WHERE name = 'inventory_accounting')
    WHEN 'finance' THEN (SELECT id FROM public.subject_areas WHERE name = 'finance')
    WHEN 'banking' THEN (SELECT id FROM public.subject_areas WHERE name = 'finance')
    WHEN 'fixed_assets' THEN (SELECT id FROM public.subject_areas WHERE name = 'accounting')
    WHEN 'receivables' THEN (SELECT id FROM public.subject_areas WHERE name = 'sales_accounting')
    WHEN 'payables' THEN (SELECT id FROM public.subject_areas WHERE name = 'accounting')
    WHEN 'equity' THEN (SELECT id FROM public.subject_areas WHERE name = 'finance')
    WHEN 'other' THEN (SELECT id FROM public.subject_areas WHERE name = 'accounting')
    ELSE (SELECT id FROM public.subject_areas WHERE name = 'accounting')
  END
);

-- After migration, we can drop the old ENUM columns
-- (We'll do this after confirming the migration worked)
-- ALTER TABLE public.action_groups DROP COLUMN subject_area;
-- ALTER TABLE public.audit_action_templates DROP COLUMN subject_area;
-- ALTER TABLE public.client_audit_actions DROP COLUMN subject_area;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_subject_areas_parent ON public.subject_areas(parent_subject_area_id);
CREATE INDEX IF NOT EXISTS idx_action_groups_subject_area ON public.action_groups(subject_area_id);
CREATE INDEX IF NOT EXISTS idx_audit_action_templates_subject_area ON public.audit_action_templates(subject_area_id);
CREATE INDEX IF NOT EXISTS idx_client_audit_actions_subject_area ON public.client_audit_actions(subject_area_id);
