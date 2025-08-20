-- SECURITY FIX: Add server-side authorization for role updates
-- Create a secure function to update user roles with proper authorization checks

CREATE OR REPLACE FUNCTION public.secure_update_user_role(
  p_user_id UUID,
  p_new_role TEXT
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  current_user_role TEXT;
  target_user_firm_id UUID;
  current_user_firm_id UUID;
BEGIN
  -- Get current user's role and firm
  SELECT user_role, audit_firm_id INTO current_user_role, current_user_firm_id
  FROM public.profiles
  WHERE id = auth.uid();
  
  -- Get target user's firm
  SELECT audit_firm_id INTO target_user_firm_id
  FROM public.profiles
  WHERE id = p_user_id;
  
  -- Authorization checks
  IF current_user_role IS NULL THEN
    RAISE EXCEPTION 'User not found or not authenticated';
  END IF;
  
  -- Only admins and partners can change roles
  IF current_user_role NOT IN ('admin', 'partner') THEN
    RAISE EXCEPTION 'Insufficient permissions to change user roles';
  END IF;
  
  -- Users can only change roles within their own firm
  IF current_user_firm_id != target_user_firm_id THEN
    RAISE EXCEPTION 'Cannot change roles for users outside your firm';
  END IF;
  
  -- Partners cannot promote users to admin
  IF current_user_role = 'partner' AND p_new_role = 'admin' THEN
    RAISE EXCEPTION 'Partners cannot promote users to admin role';
  END IF;
  
  -- Users cannot change their own role
  IF auth.uid() = p_user_id THEN
    RAISE EXCEPTION 'Cannot change your own role';
  END IF;
  
  -- Validate the new role
  IF p_new_role NOT IN ('admin', 'partner', 'manager', 'employee') THEN
    RAISE EXCEPTION 'Invalid role specified';
  END IF;
  
  -- Update the role
  UPDATE public.profiles
  SET user_role = p_new_role,
      updated_at = now()
  WHERE id = p_user_id;
  
  -- Log the role change for audit
  INSERT INTO public.admin_audit_logs (
    user_id,
    target_user_id,
    action_type,
    description,
    old_values,
    new_values,
    metadata
  ) VALUES (
    auth.uid(),
    p_user_id,
    'role_change',
    'User role updated',
    jsonb_build_object('old_role', (SELECT user_role FROM public.profiles WHERE id = p_user_id)),
    jsonb_build_object('new_role', p_new_role),
    jsonb_build_object('timestamp', now(), 'method', 'secure_update_user_role')
  );
  
  RETURN TRUE;
END;
$$;

-- Fix search path for functions that don't have it set
ALTER FUNCTION public.populate_account_fields() SET search_path TO '';
ALTER FUNCTION public.update_updated_at_column() SET search_path TO '';
ALTER FUNCTION public.generate_certificate_number() SET search_path TO '';
ALTER FUNCTION public.increment_cache_hit(text) SET search_path TO '';
ALTER FUNCTION public.calculate_straight_line_depreciation(numeric, numeric, integer) SET search_path TO '';

-- Add rate limiting and security event logging
CREATE TABLE IF NOT EXISTS public.rate_limit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  action_type TEXT NOT NULL,
  ip_address INET,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  metadata JSONB DEFAULT '{}'
);

ALTER TABLE public.rate_limit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own rate limit logs"
ON public.rate_limit_log
FOR SELECT
USING (user_id = auth.uid() OR get_user_role(auth.uid()) = 'admin');

CREATE POLICY "System can insert rate limit logs"
ON public.rate_limit_log
FOR INSERT
WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.security_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  event_type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'info',
  description TEXT NOT NULL,
  ip_address INET,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all security events"
ON public.security_events
FOR SELECT
USING (get_user_role(auth.uid()) IN ('admin', 'partner'));

CREATE POLICY "System can insert security events"
ON public.security_events
FOR INSERT
WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.log_security_event(
  p_event_type TEXT,
  p_severity TEXT DEFAULT 'info',
  p_description TEXT DEFAULT '',
  p_metadata JSONB DEFAULT '{}'
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  INSERT INTO public.security_events (
    user_id,
    event_type,
    severity,
    description,
    metadata
  ) VALUES (
    auth.uid(),
    p_event_type,
    p_severity,
    p_description,
    p_metadata
  );
END;
$$;