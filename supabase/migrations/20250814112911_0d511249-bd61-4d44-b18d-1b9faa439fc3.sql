-- Add default permissions data
INSERT INTO public.custom_permissions (name, description, category, is_active) VALUES
('view_clients', 'Kan se klientinformasjon', 'client_access', true),
('edit_clients', 'Kan redigere klientinformasjon', 'client_access', true),
('delete_clients', 'Kan slette klienter', 'client_access', true),
('manage_users', 'Kan administrere brukere', 'system_admin', true),
('manage_roles', 'Kan administrere roller og tillatelser', 'system_admin', true),
('view_audit_logs', 'Kan se revisjonslogger', 'system_admin', true),
('generate_reports', 'Kan generere rapporter', 'reporting', true),
('export_data', 'Kan eksportere data', 'reporting', true),
('upload_data', 'Kan laste opp regnskapsdata', 'data_management', true),
('manage_documents', 'Kan administrere dokumenter', 'data_management', true)
ON CONFLICT DO NOTHING;

-- Add custom roles table
CREATE TABLE IF NOT EXISTS public.custom_roles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  audit_firm_id uuid REFERENCES public.audit_firms(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  is_system_role boolean NOT NULL DEFAULT false,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(audit_firm_id, name)
);

-- Enable RLS
ALTER TABLE public.custom_roles ENABLE ROW LEVEL SECURITY;

-- Policies for custom roles
CREATE POLICY "Firm members can view custom roles" ON public.custom_roles
FOR SELECT USING (
  audit_firm_id = get_user_firm(auth.uid()) OR is_system_role = true
);

CREATE POLICY "Admins can manage custom roles" ON public.custom_roles
FOR ALL USING (
  audit_firm_id = get_user_firm(auth.uid()) AND
  get_user_role(auth.uid()) = ANY (ARRAY['admin'::user_role_type, 'partner'::user_role_type])
);

-- Add trigger for updating updated_at
CREATE TRIGGER update_custom_roles_updated_at
BEFORE UPDATE ON public.custom_roles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add role permissions mapping table
CREATE TABLE IF NOT EXISTS public.custom_role_permissions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  role_id uuid NOT NULL REFERENCES public.custom_roles(id) ON DELETE CASCADE,
  permission_id uuid NOT NULL REFERENCES public.custom_permissions(id) ON DELETE CASCADE,
  granted_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(role_id, permission_id)
);

-- Enable RLS
ALTER TABLE public.custom_role_permissions ENABLE ROW LEVEL SECURITY;

-- Policies for role permissions
CREATE POLICY "Firm members can view role permissions" ON public.custom_role_permissions
FOR SELECT USING (
  role_id IN (
    SELECT id FROM public.custom_roles 
    WHERE audit_firm_id = get_user_firm(auth.uid()) OR is_system_role = true
  )
);

CREATE POLICY "Admins can manage role permissions" ON public.custom_role_permissions
FOR ALL USING (
  role_id IN (
    SELECT id FROM public.custom_roles 
    WHERE audit_firm_id = get_user_firm(auth.uid())
  ) AND
  get_user_role(auth.uid()) = ANY (ARRAY['admin'::user_role_type, 'partner'::user_role_type])
);

-- Add department access table for granular department-specific permissions
CREATE TABLE IF NOT EXISTS public.department_access (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  department_id uuid NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
  access_type text NOT NULL CHECK (access_type IN ('full', 'read', 'limited')),
  granted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  granted_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone,
  is_active boolean NOT NULL DEFAULT true,
  UNIQUE(user_id, department_id)
);

-- Enable RLS
ALTER TABLE public.department_access ENABLE ROW LEVEL SECURITY;

-- Policies for department access
CREATE POLICY "Firm members can view department access" ON public.department_access
FOR SELECT USING (
  department_id IN (
    SELECT id FROM public.departments 
    WHERE audit_firm_id = get_user_firm(auth.uid())
  )
);

CREATE POLICY "Admins can manage department access" ON public.department_access
FOR ALL USING (
  department_id IN (
    SELECT id FROM public.departments 
    WHERE audit_firm_id = get_user_firm(auth.uid())
  ) AND
  get_user_role(auth.uid()) = ANY (ARRAY['admin'::user_role_type, 'partner'::user_role_type, 'manager'::user_role_type])
);