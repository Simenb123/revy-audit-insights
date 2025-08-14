-- Add audit logging table for admin actions
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type text NOT NULL,
  target_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  description text NOT NULL,
  old_values jsonb DEFAULT '{}',
  new_values jsonb DEFAULT '{}',
  metadata jsonb DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Policy for viewing audit logs - only admins/partners
CREATE POLICY "Admins can view audit logs" ON public.admin_audit_logs
FOR SELECT USING (
  get_user_role(auth.uid()) = ANY (ARRAY['admin'::user_role_type, 'partner'::user_role_type])
);

-- Policy for inserting audit logs
CREATE POLICY "System can insert audit logs" ON public.admin_audit_logs
FOR INSERT WITH CHECK (true);

-- Add temporary access table
CREATE TABLE IF NOT EXISTS public.temporary_access (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  resource_type text NOT NULL CHECK (resource_type IN ('client', 'department', 'system')),
  resource_id uuid,
  granted_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  end_date date NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'revoked')),
  reason text,
  metadata jsonb DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.temporary_access ENABLE ROW LEVEL SECURITY;

-- Policies for temporary access
CREATE POLICY "Firm members can view temporary access" ON public.temporary_access
FOR SELECT USING (
  get_user_firm(auth.uid()) = get_user_firm(user_id)
);

CREATE POLICY "Admins can manage temporary access" ON public.temporary_access
FOR ALL USING (
  get_user_role(auth.uid()) = ANY (ARRAY['admin'::user_role_type, 'partner'::user_role_type, 'manager'::user_role_type])
);

-- Add trigger for updating updated_at
CREATE TRIGGER update_temporary_access_updated_at
BEFORE UPDATE ON public.temporary_access
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add custom permissions table
CREATE TABLE IF NOT EXISTS public.custom_permissions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  audit_firm_id uuid REFERENCES public.audit_firms(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'custom',
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.custom_permissions ENABLE ROW LEVEL SECURITY;

-- Policies for custom permissions
CREATE POLICY "Firm members can view custom permissions" ON public.custom_permissions
FOR SELECT USING (
  audit_firm_id = get_user_firm(auth.uid())
);

CREATE POLICY "Admins can manage custom permissions" ON public.custom_permissions
FOR ALL USING (
  audit_firm_id = get_user_firm(auth.uid()) AND
  get_user_role(auth.uid()) = ANY (ARRAY['admin'::user_role_type, 'partner'::user_role_type])
);

-- Add user permissions mapping table
CREATE TABLE IF NOT EXISTS public.user_custom_permissions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  permission_id uuid NOT NULL REFERENCES public.custom_permissions(id) ON DELETE CASCADE,
  granted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  granted_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone,
  UNIQUE(user_id, permission_id)
);

-- Enable RLS
ALTER TABLE public.user_custom_permissions ENABLE ROW LEVEL SECURITY;

-- Policies for user custom permissions
CREATE POLICY "Firm members can view user permissions" ON public.user_custom_permissions
FOR SELECT USING (
  get_user_firm(user_id) = get_user_firm(auth.uid())
);

CREATE POLICY "Admins can manage user permissions" ON public.user_custom_permissions
FOR ALL USING (
  get_user_firm(user_id) = get_user_firm(auth.uid()) AND
  get_user_role(auth.uid()) = ANY (ARRAY['admin'::user_role_type, 'partner'::user_role_type])
);