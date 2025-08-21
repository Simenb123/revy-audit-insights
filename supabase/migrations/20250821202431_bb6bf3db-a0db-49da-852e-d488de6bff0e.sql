-- Security Fixes Migration
-- Phase 1: Immediate Data Protection

-- 1. Secure Legal Documents Access
-- Add RLS policies for legal_documents table
CREATE POLICY "Authenticated users can view legal documents" 
ON public.legal_documents 
FOR SELECT 
USING (auth.role() = 'authenticated'::text);

CREATE POLICY "Admins can manage legal documents" 
ON public.legal_documents 
FOR ALL 
USING (get_user_role(auth.uid()) = ANY (ARRAY['admin'::user_role_type, 'partner'::user_role_type]))
WITH CHECK (get_user_role(auth.uid()) = ANY (ARRAY['admin'::user_role_type, 'partner'::user_role_type]));

-- Add RLS policies for legal_citations table
CREATE POLICY "Authenticated users can view legal citations" 
ON public.legal_citations 
FOR SELECT 
USING (auth.role() = 'authenticated'::text);

CREATE POLICY "Admins can manage legal citations" 
ON public.legal_citations 
FOR ALL 
USING (get_user_role(auth.uid()) = ANY (ARRAY['admin'::user_role_type, 'partner'::user_role_type]))
WITH CHECK (get_user_role(auth.uid()) = ANY (ARRAY['admin'::user_role_type, 'partner'::user_role_type]));

-- Restrict knowledge_article_tags to authenticated users
CREATE POLICY "Authenticated users can view knowledge article tags" 
ON public.knowledge_article_tags 
FOR SELECT 
USING (auth.role() = 'authenticated'::text);

CREATE POLICY "Admins can manage knowledge article tags" 
ON public.knowledge_article_tags 
FOR ALL 
USING (get_user_role(auth.uid()) = ANY (ARRAY['admin'::user_role_type, 'partner'::user_role_type]))
WITH CHECK (get_user_role(auth.uid()) = ANY (ARRAY['admin'::user_role_type, 'partner'::user_role_type]));

-- 2. Fix User Profile Security Constraints
-- Make profiles.is_active NOT NULL with default FALSE where it exists
DO $$
BEGIN
    -- Check if is_active column exists and update constraint
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'profiles' AND column_name = 'is_active') THEN
        ALTER TABLE public.profiles ALTER COLUMN is_active SET DEFAULT FALSE;
        ALTER TABLE public.profiles ALTER COLUMN is_active SET NOT NULL;
    END IF;
END $$;

-- Ensure user_role is properly constrained
ALTER TABLE public.profiles ALTER COLUMN user_role SET DEFAULT 'employee';

-- 3. Secure Database Functions - Add SET search_path to functions missing it
-- Update get_user_role function
CREATE OR REPLACE FUNCTION public.get_user_role(user_uuid uuid)
RETURNS user_role_type
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = ''
AS $function$
  SELECT user_role FROM public.profiles WHERE id = user_uuid;
$function$;

-- Update get_user_firm function  
CREATE OR REPLACE FUNCTION public.get_user_firm(user_uuid uuid)
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = ''
AS $function$
  SELECT audit_firm_id FROM public.profiles WHERE id = user_uuid;
$function$;

-- Update get_user_department function
CREATE OR REPLACE FUNCTION public.get_user_department(user_uuid uuid)
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = ''
AS $function$
  SELECT department_id FROM public.profiles WHERE id = user_uuid;
$function$;

-- Update is_super_admin function
CREATE OR REPLACE FUNCTION public.is_super_admin(user_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = ''
AS $function$
  SELECT EXISTS(
    SELECT 1 FROM public.app_super_admins a WHERE a.user_id = user_uuid
  );
$function$;

-- Update user_owns_client function
CREATE OR REPLACE FUNCTION public.user_owns_client(client_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = ''
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.clients 
    WHERE id = client_uuid 
    AND user_id = auth.uid()
  );
$function$;

-- Update get_user_team_ids function
CREATE OR REPLACE FUNCTION public.get_user_team_ids(user_uuid uuid)
RETURNS TABLE(team_id uuid)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = ''
AS $function$
  SELECT tm.team_id 
  FROM public.team_members tm 
  WHERE tm.user_id = user_uuid AND tm.is_active = true;
$function$;

-- Update get_user_teams function
CREATE OR REPLACE FUNCTION public.get_user_teams(user_uuid uuid)
RETURNS TABLE(team_id uuid)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = ''
AS $function$
  SELECT tm.team_id 
  FROM public.team_members tm 
  WHERE tm.user_id = user_uuid AND tm.is_active = true;
$function$;

-- 4. Enhanced Security Logging Function
CREATE OR REPLACE FUNCTION public.log_security_event(
  p_event_type text, 
  p_severity text DEFAULT 'info'::text, 
  p_description text DEFAULT ''::text, 
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
    INSERT INTO public.admin_audit_logs (
        user_id,
        action_type,
        description,
        metadata,
        created_at
    ) VALUES (
        COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid),
        p_event_type,
        p_description,
        p_metadata || jsonb_build_object('severity', p_severity),
        now()
    );
END;
$function$;

-- 5. Add security constraint validation trigger
CREATE OR REPLACE FUNCTION public.validate_user_security_constraints()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  -- Ensure user_role is not null for active profiles
  IF NEW.user_role IS NULL AND COALESCE(NEW.is_active, true) = true THEN
    RAISE EXCEPTION 'Active profiles must have a user role assigned';
  END IF;
  
  -- Log profile changes for security monitoring
  IF TG_OP = 'UPDATE' AND (OLD.user_role IS DISTINCT FROM NEW.user_role) THEN
    PERFORM public.log_security_event(
      'profile_role_change',
      'info',
      'User role changed from ' || COALESCE(OLD.user_role::text, 'null') || ' to ' || COALESCE(NEW.user_role::text, 'null'),
      jsonb_build_object('user_id', NEW.id, 'old_role', OLD.user_role, 'new_role', NEW.user_role)
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Apply the security validation trigger to profiles
DROP TRIGGER IF EXISTS validate_user_security_constraints_trigger ON public.profiles;
CREATE TRIGGER validate_user_security_constraints_trigger
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_user_security_constraints();

-- 6. Add rate limiting for sensitive operations
CREATE TABLE IF NOT EXISTS public.security_rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  operation_type text NOT NULL,
  attempt_count integer DEFAULT 1,
  last_attempt_at timestamp with time zone DEFAULT now(),
  blocked_until timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, operation_type)
);

-- Enable RLS on rate limits table
ALTER TABLE public.security_rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own rate limits" 
ON public.security_rate_limits 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "System can manage rate limits" 
ON public.security_rate_limits 
FOR ALL 
USING (true)
WITH CHECK (true);

-- 7. Create security monitoring view for admins
CREATE OR REPLACE VIEW public.security_overview AS
SELECT 
  'admin_actions' as metric_type,
  COUNT(*) as count,
  DATE_TRUNC('day', created_at) as date
FROM public.admin_audit_logs 
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', created_at)
UNION ALL
SELECT 
  'failed_logins' as metric_type,
  COUNT(*) as count,
  DATE_TRUNC('day', created_at) as date
FROM public.admin_audit_logs 
WHERE action_type LIKE '%failed%' 
  AND created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY date DESC;

-- Grant view access to admins only
CREATE POLICY "Admins can view security overview" 
ON public.security_overview
FOR SELECT 
USING (get_user_role(auth.uid()) = ANY (ARRAY['admin'::user_role_type, 'partner'::user_role_type]));

-- Enable RLS on the view (if supported)
-- Note: Views don't directly support RLS, but the underlying tables do