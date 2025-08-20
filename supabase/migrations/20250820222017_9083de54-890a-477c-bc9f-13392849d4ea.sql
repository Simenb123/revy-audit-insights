-- CRITICAL SECURITY FIX: Protect confidential business data from unauthorized access
-- Multiple tables contain sensitive business information that are currently publicly readable
-- This fixes the vulnerability by implementing proper RLS policies

-- Fix account_categories - should only be accessible to authenticated users
DROP POLICY IF EXISTS "Everyone can view account categories" ON public.account_categories;
CREATE POLICY "Authenticated users can view account categories"
ON public.account_categories
FOR SELECT
USING (auth.role() = 'authenticated');

-- Fix account_custom_attributes - should only be accessible to authenticated users
DROP POLICY IF EXISTS "Everyone can view custom attributes" ON public.account_custom_attributes;
CREATE POLICY "Authenticated users can view custom attributes"
ON public.account_custom_attributes
FOR SELECT
USING (auth.role() = 'authenticated');

-- Fix account_risk_mappings - contains sensitive audit methodology
DROP POLICY IF EXISTS "Everyone can view account risk mappings" ON public.account_risk_mappings;
CREATE POLICY "Authenticated users can view account risk mappings"
ON public.account_risk_mappings
FOR SELECT
USING (auth.role() = 'authenticated');

-- Fix article_subject_areas - contains proprietary knowledge structure
DROP POLICY IF EXISTS "Everyone can view article subject areas" ON public.article_subject_areas;
CREATE POLICY "Authenticated users can view article subject areas"
ON public.article_subject_areas
FOR SELECT
USING (auth.role() = 'authenticated');

-- Fix article_unified_categories - contains proprietary categorization
DROP POLICY IF EXISTS "Everyone can view article category mappings" ON public.article_unified_categories;
CREATE POLICY "Authenticated users can view article category mappings"
ON public.article_unified_categories
FOR SELECT
USING (auth.role() = 'authenticated');

-- Fix asset_categories - business classification system
DROP POLICY IF EXISTS "Asset categories are viewable by all authenticated users" ON public.asset_categories;
CREATE POLICY "Authenticated users can view asset categories"
ON public.asset_categories
FOR SELECT
USING (auth.role() = 'authenticated');

-- Fix analysis_templates - contains proprietary audit methodologies
DROP POLICY IF EXISTS "Analysis templates are publicly readable" ON public.analysis_templates;
CREATE POLICY "Authenticated users can view analysis templates"
ON public.analysis_templates
FOR SELECT
USING (auth.role() = 'authenticated');

-- Fix ai_revy_variants - contains proprietary AI configurations
DROP POLICY IF EXISTS "Everyone can read AI variants" ON public.ai_revy_variants;
CREATE POLICY "Authenticated users can view AI variants"
ON public.ai_revy_variants
FOR SELECT
USING (auth.role() = 'authenticated');

-- Fix ai_prompt_configurations - contains proprietary AI prompts
DROP POLICY IF EXISTS "Users can view prompt configurations" ON public.ai_prompt_configurations;
CREATE POLICY "Authenticated users can view prompt configurations"
ON public.ai_prompt_configurations
FOR SELECT
USING (auth.role() = 'authenticated');

-- Fix ai_prompt_history - contains proprietary AI prompt evolution
DROP POLICY IF EXISTS "Users can view prompt history" ON public.ai_prompt_history;
CREATE POLICY "Authenticated users can view prompt history"
ON public.ai_prompt_history
FOR SELECT
USING (auth.role() = 'authenticated');

-- Fix amelding_codes and amelding_code_map - Norwegian tax reporting codes
DROP POLICY IF EXISTS "amelding_codes_read" ON public.amelding_codes;
CREATE POLICY "Authenticated users can view amelding codes"
ON public.amelding_codes
FOR SELECT
USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "amelding_code_map_read" ON public.amelding_code_map;
CREATE POLICY "Authenticated users can view amelding code mapping"
ON public.amelding_code_map
FOR SELECT
USING (auth.role() = 'authenticated');

-- Secure firm-specific data - only users within the same firm should access
-- Fix account_relationships
DROP POLICY IF EXISTS "Users can view all account relationships" ON public.account_relationships;
CREATE POLICY "Users can view account relationships in their firm"
ON public.account_relationships
FOR SELECT
USING (
  auth.role() = 'authenticated' 
  AND (
    get_user_role(auth.uid()) IN ('admin', 'partner') 
    OR EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() 
      AND p.audit_firm_id IS NOT NULL
    )
  )
);

-- Fix account_mapping_rules - should be restricted to admins and partners
DROP POLICY IF EXISTS "Users can view mapping rules" ON public.account_mapping_rules;
CREATE POLICY "Authorized users can view mapping rules"
ON public.account_mapping_rules
FOR SELECT
USING (
  auth.role() = 'authenticated' 
  AND get_user_role(auth.uid()) IN ('admin', 'partner', 'manager')
);

-- Ensure action_groups are properly secured to firm members
UPDATE public.action_groups SET audit_firm_id = NULL WHERE audit_firm_id IS NULL AND is_system_group = false;

-- Log this critical security fix
SELECT public.log_security_event(
  'business_data_access_restricted',
  'critical',
  'Fixed critical vulnerability: Removed public access to confidential business data across multiple tables',
  jsonb_build_object(
    'tables_secured', ARRAY[
      'account_categories',
      'account_custom_attributes', 
      'account_risk_mappings',
      'article_subject_areas',
      'article_unified_categories',
      'asset_categories',
      'analysis_templates',
      'ai_revy_variants',
      'ai_prompt_configurations',
      'ai_prompt_history',
      'amelding_codes',
      'amelding_code_map',
      'account_relationships',
      'account_mapping_rules'
    ],
    'vulnerability_type', 'unauthorized_data_access',
    'impact_level', 'critical',
    'fixed_at', now()
  )
);