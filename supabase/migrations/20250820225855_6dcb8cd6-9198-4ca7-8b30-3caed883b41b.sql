-- Fix security issue: Restrict access to audit action templates to prevent competitor theft
-- This migration addresses the security vulnerability where proprietary audit templates
-- could be accessed by competitors

-- First, drop existing overly permissive policies
DROP POLICY IF EXISTS "Authenticated users can view authorized templates" ON public.audit_action_templates;
DROP POLICY IF EXISTS "Users can view templates in their firm" ON public.audit_action_templates;
DROP POLICY IF EXISTS "Users can create audit action templates" ON public.audit_action_templates;
DROP POLICY IF EXISTS "Users can update their own audit action templates" ON public.audit_action_templates;
DROP POLICY IF EXISTS "Users can delete their own audit action templates" ON public.audit_action_templates;

-- Create secure RLS policies that protect proprietary content

-- SELECT: Users can only view system templates or templates from their own firm
CREATE POLICY "Secure template access" ON public.audit_action_templates
FOR SELECT
TO authenticated
USING (
  -- System templates are accessible to all authenticated users
  (is_system_template = true) 
  OR 
  -- Firm-specific templates only accessible to users in the same firm
  (is_system_template = false AND audit_firm_id = get_user_firm(auth.uid()) AND audit_firm_id IS NOT NULL)
  OR
  -- Users can always see templates they created themselves
  (created_by = auth.uid())
);

-- INSERT: Users can create templates in their firm only
CREATE POLICY "Secure template creation" ON public.audit_action_templates
FOR INSERT
TO authenticated
WITH CHECK (
  -- Ensure created_by is set to current user
  (created_by = auth.uid())
  AND
  -- For non-system templates, audit_firm_id must be set to user's firm
  (
    (is_system_template = false AND audit_firm_id = get_user_firm(auth.uid()) AND audit_firm_id IS NOT NULL)
    OR
    -- Only super admins can create system templates
    (is_system_template = true AND is_super_admin(auth.uid()))
  )
);

-- UPDATE: Users can only update templates in their own firm or that they created
CREATE POLICY "Secure template updates" ON public.audit_action_templates
FOR UPDATE
TO authenticated
USING (
  -- System templates can only be updated by super admins
  (is_system_template = true AND is_super_admin(auth.uid()))
  OR
  -- Firm templates can be updated by users in the same firm with appropriate roles
  (
    is_system_template = false 
    AND audit_firm_id = get_user_firm(auth.uid()) 
    AND audit_firm_id IS NOT NULL
    AND (
      created_by = auth.uid() 
      OR get_user_role(auth.uid()) IN ('admin', 'partner', 'manager')
    )
  )
);

-- DELETE: Users can only delete templates they created or if they have admin rights in their firm
CREATE POLICY "Secure template deletion" ON public.audit_action_templates
FOR DELETE
TO authenticated
USING (
  -- System templates can only be deleted by super admins
  (is_system_template = true AND is_super_admin(auth.uid()))
  OR
  -- Firm templates can be deleted by creator or firm admins
  (
    is_system_template = false 
    AND audit_firm_id = get_user_firm(auth.uid()) 
    AND audit_firm_id IS NOT NULL
    AND (
      created_by = auth.uid() 
      OR get_user_role(auth.uid()) IN ('admin', 'partner')
    )
  )
);

-- Add constraint to ensure data integrity
-- System templates should have NULL audit_firm_id, firm templates should have non-NULL audit_firm_id
ALTER TABLE public.audit_action_templates 
ADD CONSTRAINT check_template_firm_consistency 
CHECK (
  (is_system_template = true AND audit_firm_id IS NULL) 
  OR 
  (is_system_template = false AND audit_firm_id IS NOT NULL)
);

-- Update existing data to ensure consistency
-- Set audit_firm_id to NULL for all system templates
UPDATE public.audit_action_templates 
SET audit_firm_id = NULL 
WHERE is_system_template = true;

-- For non-system templates without audit_firm_id, try to infer from created_by
UPDATE public.audit_action_templates 
SET audit_firm_id = (
  SELECT audit_firm_id 
  FROM public.profiles 
  WHERE id = audit_action_templates.created_by
)
WHERE is_system_template = false 
  AND audit_firm_id IS NULL 
  AND created_by IS NOT NULL;

-- Mark remaining templates without firm as system templates (safeguard)
UPDATE public.audit_action_templates 
SET is_system_template = true, audit_firm_id = NULL
WHERE audit_firm_id IS NULL AND is_system_template = false;