-- CRITICAL SECURITY FIX: Remove public access to confidential business information
-- This addresses exposure of proprietary content, audit procedures, and business calculation methods

-- 1. FIX KNOWLEDGE ARTICLES - Remove public access to published articles
DROP POLICY IF EXISTS "Published articles are public" ON public.knowledge_articles;

-- Knowledge articles now require authentication to view published content
-- The remaining policy "Anyone can view published articles" requires auth.role() = 'authenticated'
-- Authors can still view their own articles regardless of status

-- 2. FIX AUDIT ACTION TEMPLATES - Ensure system templates require authentication
-- Remove any overly permissive policies and ensure proper authentication
DROP POLICY IF EXISTS "Users can view audit action templates" ON public.audit_action_templates;

-- Create a new secure policy for viewing audit action templates
CREATE POLICY "Authenticated users can view authorized templates" ON public.audit_action_templates
FOR SELECT 
TO authenticated
USING (
  -- System templates require authentication but are available to all authenticated users
  (is_system_template = true) OR
  -- Own templates 
  (auth.uid() = created_by) OR 
  -- Templates in user's firm
  (audit_firm_id = get_user_firm(auth.uid())) OR
  -- Admin/Partner/Manager access
  (auth.uid() IN (
    SELECT p.id FROM profiles p 
    WHERE p.user_role = ANY (ARRAY['admin'::user_role_type, 'partner'::user_role_type, 'manager'::user_role_type])
  ))
);

-- 3. FIX FORMULA DEFINITIONS - Ensure system formulas require authentication  
DROP POLICY IF EXISTS "Formulas are readable (system or owner)" ON public.formula_definitions;
DROP POLICY IF EXISTS "Users can view system and own formulas" ON public.formula_definitions;

-- Create a new secure policy for viewing formula definitions
CREATE POLICY "Authenticated users can view authorized formulas" ON public.formula_definitions
FOR SELECT 
TO authenticated  
USING (
  -- System formulas require authentication but are available to authenticated users
  (is_system_formula = true) OR
  -- Own formulas
  (created_by = auth.uid())
);

-- Verify no unauthenticated access remains by ensuring all policies require authentication
-- All remaining policies should have role restrictions or auth.uid() checks