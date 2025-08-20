-- CRITICAL SECURITY FIX: Protect proprietary audit templates and methodologies
-- Multiple audit action tables contain detailed audit procedures that competitors could steal
-- This fixes public access to sensitive audit methodologies and intellectual property

-- Fix audit_action_area_mappings - contains audit area methodology
DROP POLICY IF EXISTS "Area mappings are readable by all authenticated users" ON public.audit_action_area_mappings;
CREATE POLICY "Firm members can view audit area mappings"
ON public.audit_action_area_mappings
FOR SELECT
USING (
  auth.role() = 'authenticated' AND (
    -- System admins can view all
    get_user_role(auth.uid()) IN ('admin', 'partner') 
    OR 
    -- Users can only view mappings for templates in their firm
    action_template_id IN (
      SELECT id FROM public.audit_action_templates 
      WHERE audit_firm_id = get_user_firm(auth.uid()) 
      OR is_system_template = true
      OR audit_firm_id IS NULL
    )
  )
);

-- Fix audit_action_contexts - contains detailed audit procedures
DROP POLICY IF EXISTS "Action contexts are readable by all authenticated users" ON public.audit_action_contexts;
CREATE POLICY "Firm members can view audit action contexts"
ON public.audit_action_contexts
FOR SELECT
USING (
  auth.role() = 'authenticated' AND (
    -- System admins can view all
    get_user_role(auth.uid()) IN ('admin', 'partner')
    OR 
    -- Users can only view contexts for templates in their firm
    action_template_id IN (
      SELECT id FROM public.audit_action_templates 
      WHERE audit_firm_id = get_user_firm(auth.uid()) 
      OR is_system_template = true
      OR audit_firm_id IS NULL
    )
  )
);

-- Fix audit_action_document_mappings - contains documentation requirements
DROP POLICY IF EXISTS "Action document mappings are readable by all authenticated user" ON public.audit_action_document_mappings;
CREATE POLICY "Firm members can view audit document mappings"
ON public.audit_action_document_mappings
FOR SELECT
USING (
  auth.role() = 'authenticated' AND (
    -- System admins can view all
    get_user_role(auth.uid()) IN ('admin', 'partner')
    OR 
    -- Users can only view document mappings for templates in their firm
    action_template_id IN (
      SELECT id FROM public.audit_action_templates 
      WHERE audit_firm_id = get_user_firm(auth.uid()) 
      OR is_system_template = true
      OR audit_firm_id IS NULL
    )
  )
);

-- Fix audit_action_isa_mappings - contains ISA standard mappings (proprietary methodology)
DROP POLICY IF EXISTS "Action ISA mappings are readable by all authenticated users" ON public.audit_action_isa_mappings;
CREATE POLICY "Firm members can view audit ISA mappings"
ON public.audit_action_isa_mappings
FOR SELECT
USING (
  auth.role() = 'authenticated' AND (
    -- System admins can view all
    get_user_role(auth.uid()) IN ('admin', 'partner')
    OR 
    -- Users can only view ISA mappings for templates in their firm
    action_template_id IN (
      SELECT id FROM public.audit_action_templates 
      WHERE audit_firm_id = get_user_firm(auth.uid()) 
      OR is_system_template = true
      OR audit_firm_id IS NULL
    )
  )
);

-- Fix audit_action_risk_mappings - contains risk assessment methodology
DROP POLICY IF EXISTS "Risk mappings are readable by all authenticated users" ON public.audit_action_risk_mappings;
CREATE POLICY "Firm members can view audit risk mappings"
ON public.audit_action_risk_mappings
FOR SELECT
USING (
  auth.role() = 'authenticated' AND (
    -- System admins can view all
    get_user_role(auth.uid()) IN ('admin', 'partner')
    OR 
    -- Users can only view risk mappings for templates in their firm
    action_template_id IN (
      SELECT id FROM public.audit_action_templates 
      WHERE audit_firm_id = get_user_firm(auth.uid()) 
      OR is_system_template = true
      OR audit_firm_id IS NULL
    )
  )
);

-- Fix audit_action_subject_areas - contains subject area classifications
DROP POLICY IF EXISTS "Subject area mappings are publicly readable" ON public.audit_action_subject_areas;
CREATE POLICY "Firm members can view audit subject area mappings"
ON public.audit_action_subject_areas
FOR SELECT
USING (
  auth.role() = 'authenticated' AND (
    -- System admins can view all
    get_user_role(auth.uid()) IN ('admin', 'partner')
    OR 
    -- Users can only view subject area mappings for templates in their firm
    action_template_id IN (
      SELECT id FROM public.audit_action_templates 
      WHERE audit_firm_id = get_user_firm(auth.uid()) 
      OR is_system_template = true
      OR audit_firm_id IS NULL
    )
  )
);

-- Fix audit_action_tags - contains proprietary tagging system
DROP POLICY IF EXISTS "Action tags are publicly readable" ON public.audit_action_tags;
CREATE POLICY "Firm members can view audit action tags"
ON public.audit_action_tags
FOR SELECT
USING (
  auth.role() = 'authenticated' AND (
    -- System admins can view all
    get_user_role(auth.uid()) IN ('admin', 'partner')
    OR 
    -- Users can only view tags for templates in their firm
    action_template_id IN (
      SELECT id FROM public.audit_action_templates 
      WHERE audit_firm_id = get_user_firm(auth.uid()) 
      OR is_system_template = true
      OR audit_firm_id IS NULL
    )
  )
);

-- Log this critical security fix
SELECT public.log_security_event(
  'audit_templates_access_restricted',
  'critical',
  'Fixed critical vulnerability: Protected proprietary audit procedures and methodologies from competitor access',
  jsonb_build_object(
    'tables_secured', ARRAY[
      'audit_action_area_mappings',
      'audit_action_contexts',
      'audit_action_document_mappings', 
      'audit_action_isa_mappings',
      'audit_action_risk_mappings',
      'audit_action_subject_areas',
      'audit_action_tags'
    ],
    'vulnerability_type', 'intellectual_property_theft',
    'business_impact', 'competitors_could_steal_audit_methodologies',
    'protection_level', 'firm_based_access_control',
    'fixed_at', now()
  )
);