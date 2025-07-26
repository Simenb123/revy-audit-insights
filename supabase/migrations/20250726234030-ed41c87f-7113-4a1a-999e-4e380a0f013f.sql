-- First drop the policy that already exists
DROP POLICY IF EXISTS "team_members_department_view" ON public.team_members;
DROP POLICY IF EXISTS "team_members_department_manage" ON public.team_members;
DROP POLICY IF EXISTS "client_teams_department_access" ON public.client_teams;
DROP POLICY IF EXISTS "client_audit_actions_department_access" ON public.client_audit_actions;
DROP POLICY IF EXISTS "audit_logs_department_access" ON public.audit_logs;
DROP POLICY IF EXISTS "audit_logs_insert_own" ON public.audit_logs;

-- PHASE 1: Drop any remaining problematic policies
DROP POLICY IF EXISTS "client_teams_view_access" ON public.client_teams;
DROP POLICY IF EXISTS "client_teams_insert_access" ON public.client_teams;
DROP POLICY IF EXISTS "client_teams_update_access" ON public.client_teams;
DROP POLICY IF EXISTS "client_teams_delete_access" ON public.client_teams;

-- Drop ALL team_members policies (this is the root cause of recursion)
DROP POLICY IF EXISTS "Users can view their team memberships" ON public.team_members;
DROP POLICY IF EXISTS "team_member_access" ON public.team_members;
DROP POLICY IF EXISTS "department_access" ON public.team_members;
DROP POLICY IF EXISTS "Users can manage team memberships in their department" ON public.team_members;

-- Drop ALL client_audit_actions policies
DROP POLICY IF EXISTS "client_audit_actions_view_access" ON public.client_audit_actions;
DROP POLICY IF EXISTS "client_audit_actions_insert_access" ON public.client_audit_actions;
DROP POLICY IF EXISTS "client_audit_actions_update_access" ON public.client_audit_actions;
DROP POLICY IF EXISTS "client_audit_actions_delete_access" ON public.client_audit_actions;

-- Drop ALL audit_logs policies
DROP POLICY IF EXISTS "audit_logs_view_access" ON public.audit_logs;
DROP POLICY IF EXISTS "audit_logs_insert_access" ON public.audit_logs;

-- PHASE 2: Create get_user_team_ids as SECURITY DEFINER to bypass RLS
CREATE OR REPLACE FUNCTION public.get_user_team_ids(user_uuid uuid)
RETURNS TABLE(team_id uuid)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $function$
  -- Direct query bypassing RLS to avoid recursion
  SELECT tm.team_id 
  FROM public.team_members tm 
  WHERE tm.user_id = user_uuid AND tm.is_active = true;
$function$;

-- PHASE 3: Create SIMPLE policies using ONLY department and role checks
-- TEAM_MEMBERS: Simple policies based on department only
CREATE POLICY "team_members_department_view" ON public.team_members
FOR SELECT 
USING (
  -- Users can see team members in their department
  team_id IN (
    SELECT ct.id FROM client_teams ct 
    WHERE ct.department_id = get_user_department(auth.uid())
  ) OR
  -- Or if they're admin/partner
  get_user_role(auth.uid()) = ANY(ARRAY['admin'::user_role_type, 'partner'::user_role_type])
);

CREATE POLICY "team_members_department_manage" ON public.team_members
FOR ALL 
USING (
  -- Users can manage team members in their department
  team_id IN (
    SELECT ct.id FROM client_teams ct 
    WHERE ct.department_id = get_user_department(auth.uid())
  ) OR
  -- Or if they're admin/partner
  get_user_role(auth.uid()) = ANY(ARRAY['admin'::user_role_type, 'partner'::user_role_type])
)
WITH CHECK (
  team_id IN (
    SELECT ct.id FROM client_teams ct 
    WHERE ct.department_id = get_user_department(auth.uid())
  ) OR
  get_user_role(auth.uid()) = ANY(ARRAY['admin'::user_role_type, 'partner'::user_role_type])
);

-- CLIENT_TEAMS: Simple department-based policies only
CREATE POLICY "client_teams_department_access" ON public.client_teams
FOR ALL 
USING (
  department_id = get_user_department(auth.uid()) OR
  get_user_role(auth.uid()) = ANY(ARRAY['admin'::user_role_type, 'partner'::user_role_type])
)
WITH CHECK (
  department_id = get_user_department(auth.uid()) OR
  get_user_role(auth.uid()) = ANY(ARRAY['admin'::user_role_type, 'partner'::user_role_type])
);

-- CLIENT_AUDIT_ACTIONS: Department-based only (no team references)
CREATE POLICY "client_audit_actions_department_access" ON public.client_audit_actions
FOR ALL 
USING (
  client_id IN (
    SELECT c.id FROM clients c 
    WHERE c.department_id = get_user_department(auth.uid())
  ) OR
  get_user_role(auth.uid()) = ANY(ARRAY['admin'::user_role_type, 'partner'::user_role_type]) OR
  assigned_to = auth.uid()
)
WITH CHECK (
  client_id IN (
    SELECT c.id FROM clients c 
    WHERE c.department_id = get_user_department(auth.uid())
  ) OR
  get_user_role(auth.uid()) = ANY(ARRAY['admin'::user_role_type, 'partner'::user_role_type]) OR
  assigned_to = auth.uid()
);

-- AUDIT_LOGS: Department-based only
CREATE POLICY "audit_logs_department_access" ON public.audit_logs
FOR SELECT 
USING (
  client_id IN (
    SELECT c.id FROM clients c 
    WHERE c.department_id = get_user_department(auth.uid())
  ) OR
  get_user_role(auth.uid()) = ANY(ARRAY['admin'::user_role_type, 'partner'::user_role_type])
);

CREATE POLICY "audit_logs_insert_own" ON public.audit_logs
FOR INSERT 
WITH CHECK (user_id = auth.uid());