-- Fix infinite recursion in RLS policies by creating security definer functions

-- Create function to get user's team IDs without triggering RLS recursion
CREATE OR REPLACE FUNCTION public.get_user_team_ids(user_uuid uuid)
RETURNS TABLE(team_id uuid)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $function$
  SELECT tm.team_id 
  FROM public.team_members tm 
  WHERE tm.user_id = user_uuid AND tm.is_active = true;
$function$;

-- Update the existing get_user_teams function to use the new approach
DROP FUNCTION IF EXISTS public.get_user_teams(uuid);

CREATE OR REPLACE FUNCTION public.get_user_teams(user_uuid uuid)
RETURNS TABLE(team_id uuid)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $function$
  SELECT tm.team_id 
  FROM public.team_members tm 
  WHERE tm.user_id = user_uuid AND tm.is_active = true;
$function$;

-- Drop and recreate problematic RLS policies to fix recursion
DROP POLICY IF EXISTS "Users can view teams they are members of" ON public.client_teams;
DROP POLICY IF EXISTS "Users can update teams they are members of" ON public.client_teams;
DROP POLICY IF EXISTS "Users can delete teams they are members of" ON public.client_teams;

-- Create new policies using security definer functions
CREATE POLICY "Users can view teams they are members of"
ON public.client_teams
FOR SELECT
USING (
  (department_id = get_user_department(auth.uid())) OR
  (id = ANY(SELECT get_user_team_ids(auth.uid()))) OR
  (get_user_role(auth.uid()) = ANY(ARRAY['admin'::user_role_type, 'partner'::user_role_type]))
);

CREATE POLICY "Users can update teams they are members of"
ON public.client_teams
FOR UPDATE
USING (
  (department_id = get_user_department(auth.uid())) OR
  (id = ANY(SELECT get_user_team_ids(auth.uid()))) OR
  (get_user_role(auth.uid()) = ANY(ARRAY['admin'::user_role_type, 'partner'::user_role_type]))
);

CREATE POLICY "Users can delete teams they are members of"
ON public.client_teams
FOR DELETE
USING (
  (department_id = get_user_department(auth.uid())) OR
  (id = ANY(SELECT get_user_team_ids(auth.uid()))) OR
  (get_user_role(auth.uid()) = ANY(ARRAY['admin'::user_role_type, 'partner'::user_role_type]))
);

-- Fix any other potential recursive policies in related tables
DROP POLICY IF EXISTS "Users can view relevant audit logs" ON public.audit_logs;

CREATE POLICY "Users can view relevant audit logs"
ON public.audit_logs
FOR SELECT
USING (
  (client_id IN (
    SELECT c.id
    FROM clients c
    WHERE c.department_id = get_user_department(auth.uid())
  )) OR
  (client_id IN (
    SELECT ct.client_id
    FROM client_teams ct
    WHERE ct.id = ANY(SELECT get_user_team_ids(auth.uid()))
  )) OR
  (get_user_role(auth.uid()) = ANY(ARRAY['admin'::user_role_type, 'partner'::user_role_type]))
);

-- Fix client_audit_actions policies that might have similar issues
DROP POLICY IF EXISTS "Users can view client actions for accessible clients" ON public.client_audit_actions;
DROP POLICY IF EXISTS "Users can update client actions for accessible clients" ON public.client_audit_actions;

CREATE POLICY "Users can view client actions for accessible clients"
ON public.client_audit_actions
FOR SELECT
USING (
  (client_id IN (
    SELECT c.id
    FROM clients c
    WHERE c.department_id = get_user_department(auth.uid())
  )) OR
  (client_id IN (
    SELECT ct.client_id
    FROM client_teams ct
    WHERE ct.id = ANY(SELECT get_user_team_ids(auth.uid()))
  )) OR
  (get_user_role(auth.uid()) = ANY(ARRAY['admin'::user_role_type, 'partner'::user_role_type]))
);

CREATE POLICY "Users can update client actions for accessible clients"
ON public.client_audit_actions
FOR UPDATE
USING (
  (client_id IN (
    SELECT c.id
    FROM clients c
    WHERE c.department_id = get_user_department(auth.uid())
  )) OR
  (client_id IN (
    SELECT ct.client_id
    FROM client_teams ct
    WHERE ct.id = ANY(SELECT get_user_team_ids(auth.uid()))
  )) OR
  (get_user_role(auth.uid()) = ANY(ARRAY['admin'::user_role_type, 'partner'::user_role_type]))
);

-- Fix audit_action_recommendations policies
DROP POLICY IF EXISTS "Users can manage recommendations for accessible clients" ON public.audit_action_recommendations;
DROP POLICY IF EXISTS "Users can view recommendations for accessible clients" ON public.audit_action_recommendations;

CREATE POLICY "Users can view recommendations for accessible clients"
ON public.audit_action_recommendations
FOR SELECT
USING (
  (client_id IN (
    SELECT c.id
    FROM clients c
    WHERE c.department_id = get_user_department(auth.uid())
  )) OR
  (client_id IN (
    SELECT ct.client_id
    FROM client_teams ct
    WHERE ct.id = ANY(SELECT get_user_team_ids(auth.uid()))
  )) OR
  (get_user_role(auth.uid()) = ANY(ARRAY['admin'::user_role_type, 'partner'::user_role_type]))
);

CREATE POLICY "Users can manage recommendations for accessible clients"
ON public.audit_action_recommendations
FOR ALL
USING (
  (client_id IN (
    SELECT c.id
    FROM clients c
    WHERE c.department_id = get_user_department(auth.uid())
  )) OR
  (client_id IN (
    SELECT ct.client_id
    FROM client_teams ct
    WHERE ct.id = ANY(SELECT get_user_team_ids(auth.uid()))
  )) OR
  (get_user_role(auth.uid()) = ANY(ARRAY['admin'::user_role_type, 'partner'::user_role_type]))
)
WITH CHECK (
  (client_id IN (
    SELECT c.id
    FROM clients c
    WHERE c.department_id = get_user_department(auth.uid())
  )) OR
  (client_id IN (
    SELECT ct.client_id
    FROM client_teams ct
    WHERE ct.id = ANY(SELECT get_user_team_ids(auth.uid()))
  )) OR
  (get_user_role(auth.uid()) = ANY(ARRAY['admin'::user_role_type, 'partner'::user_role_type]))
);