
-- Create enum types for roles and communication
CREATE TYPE public.user_role_type AS ENUM ('admin', 'partner', 'manager', 'employee');
CREATE TYPE public.communication_type AS ENUM ('team', 'department', 'firm');
CREATE TYPE public.audit_log_action AS ENUM ('review_completed', 'task_assigned', 'document_uploaded', 'analysis_performed');

-- Create audit firms table
CREATE TABLE public.audit_firms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  org_number TEXT UNIQUE,
  address TEXT,
  city TEXT,
  postal_code TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create departments table
CREATE TABLE public.departments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  audit_firm_id UUID REFERENCES public.audit_firms(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  partner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Update profiles table to include firm and department
ALTER TABLE public.profiles ADD COLUMN audit_firm_id UUID REFERENCES public.audit_firms(id) ON DELETE SET NULL;
ALTER TABLE public.profiles ADD COLUMN department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL;
ALTER TABLE public.profiles ADD COLUMN user_role user_role_type DEFAULT 'employee';
ALTER TABLE public.profiles ADD COLUMN hire_date DATE;
ALTER TABLE public.profiles ADD COLUMN is_active BOOLEAN DEFAULT true;

-- Create client teams table
CREATE TABLE public.client_teams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  department_id UUID REFERENCES public.departments(id) ON DELETE CASCADE NOT NULL,
  team_lead_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  start_date DATE,
  end_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create team members table
CREATE TABLE public.team_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID REFERENCES public.client_teams(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT DEFAULT 'member',
  assigned_date DATE DEFAULT CURRENT_DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(team_id, user_id)
);

-- Create team communications table
CREATE TABLE public.team_communications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  communication_type communication_type NOT NULL,
  reference_id UUID NOT NULL, -- team_id, department_id, or firm_id
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  message TEXT NOT NULL,
  is_announcement BOOLEAN DEFAULT false,
  parent_message_id UUID REFERENCES public.team_communications(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create audit logs table for tracking work and reviews
CREATE TABLE public.audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  reviewer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action_type audit_log_action NOT NULL,
  area_name TEXT NOT NULL,
  description TEXT,
  is_reviewed BOOLEAN DEFAULT false,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Update clients table to include department assignment
ALTER TABLE public.clients ADD COLUMN department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL;

-- Create indexes for performance
CREATE INDEX idx_profiles_audit_firm ON public.profiles(audit_firm_id);
CREATE INDEX idx_profiles_department ON public.profiles(department_id);
CREATE INDEX idx_departments_firm ON public.departments(audit_firm_id);
CREATE INDEX idx_client_teams_client ON public.client_teams(client_id);
CREATE INDEX idx_client_teams_department ON public.client_teams(department_id);
CREATE INDEX idx_team_members_team ON public.team_members(team_id);
CREATE INDEX idx_team_members_user ON public.team_members(user_id);
CREATE INDEX idx_communications_reference ON public.team_communications(reference_id, communication_type);
CREATE INDEX idx_audit_logs_client ON public.audit_logs(client_id);
CREATE INDEX idx_audit_logs_user ON public.audit_logs(user_id);

-- Enable RLS on new tables
ALTER TABLE public.audit_firms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Create security definer functions for role checking
CREATE OR REPLACE FUNCTION public.get_user_role(user_uuid UUID)
RETURNS user_role_type
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT user_role FROM public.profiles WHERE id = user_uuid;
$$;

CREATE OR REPLACE FUNCTION public.get_user_department(user_uuid UUID)
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT department_id FROM public.profiles WHERE id = user_uuid;
$$;

CREATE OR REPLACE FUNCTION public.get_user_firm(user_uuid UUID)
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT audit_firm_id FROM public.profiles WHERE id = user_uuid;
$$;

-- Create RLS policies

-- Audit firms: Users can only see their own firm
CREATE POLICY "Users can view their own firm" ON public.audit_firms
  FOR SELECT USING (id = public.get_user_firm(auth.uid()));

-- Departments: Users can see departments in their firm
CREATE POLICY "Users can view departments in their firm" ON public.departments
  FOR SELECT USING (audit_firm_id = public.get_user_firm(auth.uid()));

-- Client teams: Users can see teams in their department or teams they're members of
CREATE POLICY "Users can view relevant client teams" ON public.client_teams
  FOR SELECT USING (
    department_id = public.get_user_department(auth.uid()) OR
    id IN (SELECT team_id FROM public.team_members WHERE user_id = auth.uid() AND is_active = true)
  );

-- Team members: Users can see team members of teams they're part of or in their department
CREATE POLICY "Users can view relevant team members" ON public.team_members
  FOR SELECT USING (
    team_id IN (
      SELECT ct.id FROM public.client_teams ct 
      WHERE ct.department_id = public.get_user_department(auth.uid()) OR
      ct.id IN (SELECT team_id FROM public.team_members WHERE user_id = auth.uid() AND is_active = true)
    )
  );

-- Team communications: Users can see communications for teams/departments they're part of
CREATE POLICY "Users can view relevant communications" ON public.team_communications
  FOR SELECT USING (
    (communication_type = 'team' AND reference_id IN (
      SELECT team_id FROM public.team_members WHERE user_id = auth.uid() AND is_active = true
    )) OR
    (communication_type = 'department' AND reference_id = public.get_user_department(auth.uid())) OR
    (communication_type = 'firm' AND reference_id = public.get_user_firm(auth.uid()))
  );

-- Audit logs: Users can see logs for clients they have access to
CREATE POLICY "Users can view relevant audit logs" ON public.audit_logs
  FOR SELECT USING (
    client_id IN (
      SELECT c.id FROM public.clients c
      JOIN public.client_teams ct ON c.id = ct.client_id
      JOIN public.team_members tm ON ct.id = tm.team_id
      WHERE tm.user_id = auth.uid() AND tm.is_active = true
    ) OR
    public.get_user_role(auth.uid()) IN ('admin', 'partner')
  );

-- Insert policies for team communications
CREATE POLICY "Users can insert communications" ON public.team_communications
  FOR INSERT WITH CHECK (sender_id = auth.uid());

-- Insert policies for audit logs
CREATE POLICY "Users can insert audit logs" ON public.audit_logs
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Add triggers for updated_at
CREATE TRIGGER set_audit_firms_updated_at BEFORE UPDATE ON public.audit_firms
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_departments_updated_at BEFORE UPDATE ON public.departments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_client_teams_updated_at BEFORE UPDATE ON public.client_teams
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_team_communications_updated_at BEFORE UPDATE ON public.team_communications
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
