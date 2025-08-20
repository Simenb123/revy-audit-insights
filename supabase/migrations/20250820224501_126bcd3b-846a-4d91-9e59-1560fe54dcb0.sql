-- Critical Security Fixes Migration (Fixed)

-- Phase 1: Fix tables with RLS enabled but no policies

-- 1. learning_certifications - restrict to user's own certifications
CREATE POLICY "Users can view their own certifications"
ON public.learning_certifications
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own certifications"
ON public.learning_certifications
FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own certifications"
ON public.learning_certifications
FOR UPDATE
USING (user_id = auth.uid());

-- 2. learning_notifications - restrict to user's own notifications
CREATE POLICY "Users can view their own learning notifications"
ON public.learning_notifications
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "System can insert learning notifications"
ON public.learning_notifications
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can update their own learning notifications"
ON public.learning_notifications
FOR UPDATE
USING (user_id = auth.uid());

-- 3. learning_path_modules - restrict based on firm access
CREATE POLICY "Users can view learning path modules in their firm"
ON public.learning_path_modules
FOR SELECT
USING (
  learning_path_id IN (
    SELECT id FROM public.learning_paths 
    WHERE audit_firm_id = get_user_firm(auth.uid()) OR audit_firm_id IS NULL
  )
);

CREATE POLICY "Admins can manage learning path modules in their firm"
ON public.learning_path_modules
FOR ALL
USING (
  get_user_role(auth.uid()) = ANY(ARRAY['admin'::user_role_type, 'partner'::user_role_type, 'manager'::user_role_type]) 
  AND learning_path_id IN (
    SELECT id FROM public.learning_paths 
    WHERE audit_firm_id = get_user_firm(auth.uid())
  )
)
WITH CHECK (
  get_user_role(auth.uid()) = ANY(ARRAY['admin'::user_role_type, 'partner'::user_role_type, 'manager'::user_role_type])
  AND learning_path_id IN (
    SELECT id FROM public.learning_paths 
    WHERE audit_firm_id = get_user_firm(auth.uid())
  )
);

-- 4. test_scenarios - restrict to firm access
CREATE POLICY "Users can view test scenarios in their firm"
ON public.test_scenarios
FOR SELECT
USING (
  audit_firm_id = get_user_firm(auth.uid()) OR audit_firm_id IS NULL
);

CREATE POLICY "Admins can manage test scenarios in their firm"
ON public.test_scenarios
FOR ALL
USING (
  get_user_role(auth.uid()) = ANY(ARRAY['admin'::user_role_type, 'partner'::user_role_type, 'manager'::user_role_type])
  AND (audit_firm_id = get_user_firm(auth.uid()) OR audit_firm_id IS NULL)
)
WITH CHECK (
  get_user_role(auth.uid()) = ANY(ARRAY['admin'::user_role_type, 'partner'::user_role_type, 'manager'::user_role_type])
  AND audit_firm_id = get_user_firm(auth.uid())
);

-- Phase 2: Create secure role update function with proper type casting
CREATE OR REPLACE FUNCTION public.secure_update_user_role(p_user_id uuid, p_new_role user_role_type)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  requester_role user_role_type;
  requester_firm_id uuid;
  target_firm_id uuid;
  updated_rows integer;
  old_role user_role_type;
BEGIN
  -- Get requester information
  SELECT p.user_role, p.audit_firm_id INTO requester_role, requester_firm_id
  FROM public.profiles p
  WHERE p.id = auth.uid();
  
  -- Get target user's firm and current role
  SELECT p.audit_firm_id, p.user_role INTO target_firm_id, old_role
  FROM public.profiles p
  WHERE p.id = p_user_id;
  
  -- Security checks
  IF requester_role IS NULL THEN
    RAISE EXCEPTION 'Requester not found or not authenticated';
  END IF;
  
  -- Only admin/partner can change roles, and only within same firm
  IF requester_role NOT IN ('admin'::user_role_type, 'partner'::user_role_type) THEN
    RAISE EXCEPTION 'Insufficient permissions to change user roles';
  END IF;
  
  IF requester_firm_id IS NULL OR target_firm_id IS NULL OR requester_firm_id != target_firm_id THEN
    RAISE EXCEPTION 'Can only change roles for users in same firm';
  END IF;
  
  -- Prevent privilege escalation - only admin can create admin
  IF p_new_role = 'admin'::user_role_type AND requester_role != 'admin'::user_role_type THEN
    RAISE EXCEPTION 'Only admin can assign admin role';
  END IF;
  
  -- Update the role
  UPDATE public.profiles 
  SET user_role = p_new_role, updated_at = now()
  WHERE id = p_user_id AND audit_firm_id = requester_firm_id;
  
  GET DIAGNOSTICS updated_rows = ROW_COUNT;
  
  -- Log the security event
  INSERT INTO public.admin_audit_logs (
    user_id, action_type, target_user_id, description,
    old_values, new_values, metadata
  ) VALUES (
    auth.uid(), 'role_change', p_user_id,
    format('Role changed from %s to %s', old_role::text, p_new_role::text),
    jsonb_build_object('old_role', old_role::text),
    jsonb_build_object('new_role', p_new_role::text),
    jsonb_build_object('firm_id', requester_firm_id, 'timestamp', now())
  );
  
  RETURN updated_rows > 0;
END;
$$;

-- Phase 3: Create audit logging function for security events
CREATE OR REPLACE FUNCTION public.log_security_event(
  p_event_type text,
  p_severity text DEFAULT 'info',
  p_description text DEFAULT '',
  p_metadata jsonb DEFAULT '{}'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.admin_audit_logs (
    user_id, action_type, description, metadata
  ) VALUES (
    auth.uid(), p_event_type, p_description, 
    p_metadata || jsonb_build_object('severity', p_severity, 'timestamp', now())
  );
END;
$$;

-- Phase 4: Create input validation function
CREATE OR REPLACE FUNCTION public.validate_user_input(input_text text, max_length integer DEFAULT 1000)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE STRICT
SET search_path = ''
AS $$
BEGIN
  -- Basic length check
  IF length(input_text) > max_length THEN
    RAISE EXCEPTION 'Input too long: maximum % characters allowed', max_length;
  END IF;
  
  -- Remove potentially dangerous characters/patterns
  RETURN regexp_replace(
    regexp_replace(input_text, '<script[^>]*>.*?</script>', '', 'gi'),
    'javascript:', '', 'gi'
  );
END;
$$;