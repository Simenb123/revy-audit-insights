-- Drop ALL existing policies on problematic tables to eliminate infinite recursion
DROP POLICY IF EXISTS "Users can view relevant client teams" ON public.client_teams;
DROP POLICY IF EXISTS "client_teams_all_access" ON public.client_teams;
DROP POLICY IF EXISTS "Users can create teams in their department" ON public.client_teams;
DROP POLICY IF EXISTS "Users can update teams in their department" ON public.client_teams;
DROP POLICY IF EXISTS "Users can delete teams in their department" ON public.client_teams;
DROP POLICY IF EXISTS "Users can view teams in their department" ON public.client_teams;
DROP POLICY IF EXISTS "Users can manage teams in their department" ON public.client_teams;
DROP POLICY IF EXISTS "team_member_access" ON public.client_teams;
DROP POLICY IF EXISTS "department_access" ON public.client_teams;

-- Drop ALL existing policies on client_audit_actions
DROP POLICY IF EXISTS "Users can create client audit actions for accessible clients" ON public.client_audit_actions;
DROP POLICY IF EXISTS "Users can delete client audit actions for accessible clients" ON public.client_audit_actions;
DROP POLICY IF EXISTS "Users can update client audit actions for accessible clients" ON public.client_audit_actions;
DROP POLICY IF EXISTS "Users can view client audit actions for accessible clients" ON public.client_audit_actions;
DROP POLICY IF EXISTS "client_audit_actions_department_access" ON public.client_audit_actions;
DROP POLICY IF EXISTS "client_audit_actions_team_access" ON public.client_audit_actions;

-- Drop ALL existing policies on audit_logs  
DROP POLICY IF EXISTS "Users can insert audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Users can view audit logs for accessible clients" ON public.audit_logs;
DROP POLICY IF EXISTS "audit_logs_department_access" ON public.audit_logs;
DROP POLICY IF EXISTS "audit_logs_team_access" ON public.audit_logs;

-- Drop ALL existing policies on audit_action_recommendations
DROP POLICY IF EXISTS "Users can manage recommendations for accessible clients" ON public.audit_action_recommendations;
DROP POLICY IF EXISTS "Users can view recommendations for accessible clients" ON public.audit_action_recommendations;
DROP POLICY IF EXISTS "audit_action_recommendations_department_access" ON public.audit_action_recommendations;
DROP POLICY IF EXISTS "audit_action_recommendations_team_access" ON public.audit_action_recommendations;

-- Create completely NEW and CLEAN policies using ONLY security definer functions

-- CLIENT_TEAMS policies - using only security definer functions
CREATE POLICY "client_teams_view_access" ON public.client_teams
FOR SELECT 
USING (
  department_id = get_user_department(auth.uid()) OR
  id IN (SELECT get_user_team_ids(auth.uid())) OR
  get_user_role(auth.uid()) = ANY(ARRAY['admin'::user_role_type, 'partner'::user_role_type])
);

CREATE POLICY "client_teams_insert_access" ON public.client_teams
FOR INSERT 
WITH CHECK (
  department_id = get_user_department(auth.uid()) OR
  get_user_role(auth.uid()) = ANY(ARRAY['admin'::user_role_type, 'partner'::user_role_type, 'manager'::user_role_type])
);

CREATE POLICY "client_teams_update_access" ON public.client_teams
FOR UPDATE 
USING (
  department_id = get_user_department(auth.uid()) OR
  id IN (SELECT get_user_team_ids(auth.uid())) OR
  get_user_role(auth.uid()) = ANY(ARRAY['admin'::user_role_type, 'partner'::user_role_type])
);

CREATE POLICY "client_teams_delete_access" ON public.client_teams
FOR DELETE 
USING (
  department_id = get_user_department(auth.uid()) OR
  get_user_role(auth.uid()) = ANY(ARRAY['admin'::user_role_type, 'partner'::user_role_type])
);

-- CLIENT_AUDIT_ACTIONS policies - using only security definer functions  
CREATE POLICY "client_audit_actions_view_access" ON public.client_audit_actions
FOR SELECT 
USING (
  client_id IN (
    SELECT c.id FROM clients c 
    WHERE c.department_id = get_user_department(auth.uid())
  ) OR
  client_id IN (
    SELECT ct.client_id FROM client_teams ct 
    WHERE ct.id IN (SELECT get_user_team_ids(auth.uid()))
  ) OR
  get_user_role(auth.uid()) = ANY(ARRAY['admin'::user_role_type, 'partner'::user_role_type])
);

CREATE POLICY "client_audit_actions_insert_access" ON public.client_audit_actions
FOR INSERT 
WITH CHECK (
  client_id IN (
    SELECT c.id FROM clients c 
    WHERE c.department_id = get_user_department(auth.uid())
  ) OR
  client_id IN (
    SELECT ct.client_id FROM client_teams ct 
    WHERE ct.id IN (SELECT get_user_team_ids(auth.uid()))
  ) OR
  get_user_role(auth.uid()) = ANY(ARRAY['admin'::user_role_type, 'partner'::user_role_type])
);

CREATE POLICY "client_audit_actions_update_access" ON public.client_audit_actions
FOR UPDATE 
USING (
  client_id IN (
    SELECT c.id FROM clients c 
    WHERE c.department_id = get_user_department(auth.uid())
  ) OR
  client_id IN (
    SELECT ct.client_id FROM client_teams ct 
    WHERE ct.id IN (SELECT get_user_team_ids(auth.uid()))
  ) OR
  get_user_role(auth.uid()) = ANY(ARRAY['admin'::user_role_type, 'partner'::user_role_type])
);

CREATE POLICY "client_audit_actions_delete_access" ON public.client_audit_actions
FOR DELETE 
USING (
  client_id IN (
    SELECT c.id FROM clients c 
    WHERE c.department_id = get_user_department(auth.uid())
  ) OR
  client_id IN (
    SELECT ct.client_id FROM client_teams ct 
    WHERE ct.id IN (SELECT get_user_team_ids(auth.uid()))
  ) OR
  get_user_role(auth.uid()) = ANY(ARRAY['admin'::user_role_type, 'partner'::user_role_type])
);

-- AUDIT_LOGS policies - using only security definer functions
CREATE POLICY "audit_logs_view_access" ON public.audit_logs
FOR SELECT 
USING (
  client_id IN (
    SELECT c.id FROM clients c 
    WHERE c.department_id = get_user_department(auth.uid())
  ) OR
  client_id IN (
    SELECT ct.client_id FROM client_teams ct 
    WHERE ct.id IN (SELECT get_user_team_ids(auth.uid()))
  ) OR
  get_user_role(auth.uid()) = ANY(ARRAY['admin'::user_role_type, 'partner'::user_role_type])
);

CREATE POLICY "audit_logs_insert_access" ON public.audit_logs
FOR INSERT 
WITH CHECK (user_id = auth.uid());

-- AUDIT_ACTION_RECOMMENDATIONS policies - using only security definer functions
CREATE POLICY "audit_action_recommendations_view_access" ON public.audit_action_recommendations
FOR SELECT 
USING (
  client_id IN (
    SELECT c.id FROM clients c 
    WHERE c.department_id = get_user_department(auth.uid())
  ) OR
  client_id IN (
    SELECT ct.client_id FROM client_teams ct 
    WHERE ct.id IN (SELECT get_user_team_ids(auth.uid()))
  ) OR
  get_user_role(auth.uid()) = ANY(ARRAY['admin'::user_role_type, 'partner'::user_role_type])
);

CREATE POLICY "audit_action_recommendations_manage_access" ON public.audit_action_recommendations
FOR ALL 
USING (
  client_id IN (
    SELECT c.id FROM clients c 
    WHERE c.department_id = get_user_department(auth.uid())
  ) OR
  client_id IN (
    SELECT ct.client_id FROM client_teams ct 
    WHERE ct.id IN (SELECT get_user_team_ids(auth.uid()))
  ) OR
  get_user_role(auth.uid()) = ANY(ARRAY['admin'::user_role_type, 'partner'::user_role_type])
)
WITH CHECK (
  client_id IN (
    SELECT c.id FROM clients c 
    WHERE c.department_id = get_user_department(auth.uid())
  ) OR
  client_id IN (
    SELECT ct.client_id FROM client_teams ct 
    WHERE ct.id IN (SELECT get_user_team_ids(auth.uid()))
  ) OR
  get_user_role(auth.uid()) = ANY(ARRAY['admin'::user_role_type, 'partner'::user_role_type])
);