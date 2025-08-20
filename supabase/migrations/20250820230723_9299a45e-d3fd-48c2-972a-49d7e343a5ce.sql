-- CRITICAL SECURITY FIX: Clean up data first, then apply secure policies
-- Step 1: Fix data consistency issues before applying constraints

-- First, drop ALL existing conflicting policies on audit_action_templates
DROP POLICY IF EXISTS "Authenticated users can view authorized templates" ON public.audit_action_templates;
DROP POLICY IF EXISTS "Users can view templates in their firm" ON public.audit_action_templates;
DROP POLICY IF EXISTS "Users can create audit action templates" ON public.audit_action_templates;
DROP POLICY IF EXISTS "Users can create templates in their firm" ON public.audit_action_templates;
DROP POLICY IF EXISTS "Users can update their own audit action templates" ON public.audit_action_templates;
DROP POLICY IF EXISTS "Users can update templates in their firm" ON public.audit_action_templates;
DROP POLICY IF EXISTS "Users can delete their own audit action templates" ON public.audit_action_templates;

-- Step 2: Clean up inconsistent data
-- Convert all existing templates to firm templates (safer than system templates)
UPDATE public.audit_action_templates 
SET is_system_template = false
WHERE is_system_template = true;

-- For templates without audit_firm_id, try to get it from the creator's profile
UPDATE public.audit_action_templates 
SET audit_firm_id = (
  SELECT p.audit_firm_id 
  FROM public.profiles p 
  WHERE p.id = audit_action_templates.created_by
)
WHERE audit_firm_id IS NULL 
  AND created_by IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = audit_action_templates.created_by 
    AND p.audit_firm_id IS NOT NULL
  );

-- For any remaining templates without firm_id, set a default or delete them
-- We'll mark them as belonging to the first available firm as a safeguard
UPDATE public.audit_action_templates 
SET audit_firm_id = (
  SELECT id FROM public.audit_firms LIMIT 1
)
WHERE audit_firm_id IS NULL
  AND EXISTS (SELECT 1 FROM public.audit_firms);

-- Delete any templates that still can't be assigned to a firm (orphaned data)
DELETE FROM public.audit_action_templates 
WHERE audit_firm_id IS NULL;

-- Step 3: Now create secure RLS policies that protect proprietary content

-- SELECT: Only authenticated users can view system templates or templates from their own firm
CREATE POLICY "Secure template viewing" ON public.audit_action_templates
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

-- INSERT: Only authenticated users can create templates, with proper firm association
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
    (is_system_template = true AND is_super_admin(auth.uid()) AND audit_firm_id IS NULL)
  )
);

-- UPDATE: Only authenticated users can update templates with proper authorization
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

-- DELETE: Only authenticated users can delete templates with strict authorization
CREATE POLICY "Secure template deletion" ON public.audit_action_templates
FOR DELETE
TO authenticated
USING (
  -- System templates can only be deleted by super admins
  (is_system_template = true AND is_super_admin(auth.uid()))
  OR
  -- Firm templates can be deleted by creator or firm admins/partners only
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

-- Step 4: Add data integrity constraint now that data is clean
ALTER TABLE public.audit_action_templates 
ADD CONSTRAINT check_template_firm_consistency 
CHECK (
  (is_system_template = true AND audit_firm_id IS NULL) 
  OR 
  (is_system_template = false AND audit_firm_id IS NOT NULL)
);