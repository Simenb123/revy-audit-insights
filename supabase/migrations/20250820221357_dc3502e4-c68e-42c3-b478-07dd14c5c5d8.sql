-- Manual user approval system implementation - Fixed
-- Phase 1: Set up superadmin system and user approval

-- Register simenb89@gmail.com as the initial superadmin
INSERT INTO public.app_super_admins (user_id, note) 
VALUES (
  (SELECT id FROM auth.users WHERE email = 'simenb89@gmail.com' LIMIT 1),
  'Initial superadmin - manual user approval system'
) 
ON CONFLICT (user_id) DO NOTHING;

-- Modify handle_new_user trigger to set new users as inactive by default
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    email, 
    first_name, 
    last_name, 
    workplace_company_name,
    is_active  -- Set to false for manual approval
  )
  VALUES (
    new.id, 
    new.email,
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name',
    new.raw_user_meta_data->>'workplace_company_name',
    false  -- Require manual approval
  );
  
  -- Log the new user registration for audit
  INSERT INTO public.admin_audit_logs (
    user_id, 
    action_type, 
    description, 
    metadata
  ) VALUES (
    new.id,
    'user_registration',
    'New user registered - pending approval',
    jsonb_build_object(
      'email', new.email,
      'first_name', new.raw_user_meta_data->>'first_name',
      'last_name', new.raw_user_meta_data->>'last_name',
      'workplace_company_name', new.raw_user_meta_data->>'workplace_company_name'
    )
  );
  
  RETURN new;
END;
$$;

-- Update all relevant RLS policies to check is_active status
-- Update profiles policies to include is_active check
DROP POLICY IF EXISTS "Users can view profiles in same firm" ON public.profiles;
CREATE POLICY "Users can view profiles in same firm"
ON public.profiles
FOR SELECT
USING (
  is_active = true AND (
    id = auth.uid() 
    OR (audit_firm_id IS NOT NULL AND audit_firm_id = get_user_firm(auth.uid()))
  )
);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
USING (id = auth.uid() AND is_active = true)
WITH CHECK (id = auth.uid() AND is_active = true);

-- Superadmins can view and manage all profiles (active and inactive)
CREATE POLICY "Superadmins can manage all profiles"
ON public.profiles
FOR ALL
USING (is_super_admin(auth.uid()))
WITH CHECK (is_super_admin(auth.uid()));

-- Create functions for user approval management
CREATE OR REPLACE FUNCTION public.approve_user(user_id_to_approve UUID, assign_role user_role_type DEFAULT 'employee')
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id UUID := auth.uid();
BEGIN
  -- Only superadmins can approve users
  IF NOT is_super_admin(current_user_id) THEN
    RAISE EXCEPTION 'Only superadmins can approve users';
  END IF;
  
  -- Activate the user and set their role
  UPDATE public.profiles 
  SET 
    is_active = true,
    user_role = assign_role,
    updated_at = now()
  WHERE id = user_id_to_approve;
  
  -- Log the approval
  INSERT INTO public.admin_audit_logs (
    user_id, 
    target_user_id,
    action_type, 
    description,
    metadata
  ) VALUES (
    current_user_id,
    user_id_to_approve,
    'user_approved',
    'User approved by superadmin',
    jsonb_build_object(
      'assigned_role', assign_role,
      'approved_at', now()
    )
  );
  
  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.reject_user(user_id_to_reject UUID, rejection_reason TEXT DEFAULT NULL)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id UUID := auth.uid();
BEGIN
  -- Only superadmins can reject users
  IF NOT is_super_admin(current_user_id) THEN
    RAISE EXCEPTION 'Only superadmins can reject users';
  END IF;
  
  -- Log the rejection before deletion
  INSERT INTO public.admin_audit_logs (
    user_id, 
    target_user_id,
    action_type, 
    description,
    metadata
  ) VALUES (
    current_user_id,
    user_id_to_reject,
    'user_rejected',
    'User registration rejected by superadmin',
    jsonb_build_object(
      'rejection_reason', rejection_reason,
      'rejected_at', now()
    )
  );
  
  -- Delete the user profile (this will cascade and remove the auth user)
  DELETE FROM public.profiles WHERE id = user_id_to_reject;
  
  RETURN true;
END;
$$;

-- Create function to get pending users (for superadmins)
CREATE OR REPLACE FUNCTION public.get_pending_users()
RETURNS TABLE (
  id UUID,
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  workplace_company_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.id,
    p.email,
    p.first_name,
    p.last_name,
    p.workplace_company_name,
    p.created_at
  FROM public.profiles p
  WHERE p.is_active = false
    AND is_super_admin(auth.uid())
  ORDER BY p.created_at DESC;
$$;

-- Log the implementation
SELECT public.log_security_event(
  'manual_user_approval_implemented',
  'info',
  'Manual user approval system implemented - all new users require superadmin approval',
  jsonb_build_object(
    'superadmin_email', 'simenb89@gmail.com',
    'implemented_at', now()
  )
);