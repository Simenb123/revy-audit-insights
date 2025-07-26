-- Phase 1: Clean up RLS policies to fix infinite recursion

-- Drop all existing conflicting policies on client_teams
DROP POLICY IF EXISTS "Users can view teams in their department" ON public.client_teams;
DROP POLICY IF EXISTS "Users can view teams they belong to" ON public.client_teams;
DROP POLICY IF EXISTS "Users can create teams in their department" ON public.client_teams;
DROP POLICY IF EXISTS "Users can update teams in their department" ON public.client_teams;
DROP POLICY IF EXISTS "Users can update teams they belong to" ON public.client_teams;
DROP POLICY IF EXISTS "Users can delete teams in their department" ON public.client_teams;

-- Drop all existing conflicting policies on client_audit_actions
DROP POLICY IF EXISTS "Users can create client actions for accessible clients" ON public.client_audit_actions;
DROP POLICY IF EXISTS "Users can create client actions for their clients" ON public.client_audit_actions;
DROP POLICY IF EXISTS "Users can view client actions for accessible clients" ON public.client_audit_actions;
DROP POLICY IF EXISTS "Users can view client actions for their clients" ON public.client_audit_actions;
DROP POLICY IF EXISTS "Users can update client actions for accessible clients" ON public.client_audit_actions;
DROP POLICY IF EXISTS "Users can update client actions for their clients" ON public.client_audit_actions;
DROP POLICY IF EXISTS "Users can delete client actions for accessible clients" ON public.client_audit_actions;
DROP POLICY IF EXISTS "Users can delete client actions for their clients" ON public.client_audit_actions;

-- Drop existing policies on audit_logs
DROP POLICY IF EXISTS "Users can view relevant audit logs" ON public.audit_logs;

-- Drop existing policies on audit_action_recommendations
DROP POLICY IF EXISTS "Users can manage recommendations for accessible clients" ON public.audit_action_recommendations;
DROP POLICY IF EXISTS "Users can view recommendations for accessible clients" ON public.audit_action_recommendations;

-- Create new clean policies for client_teams using only security definer functions
CREATE POLICY "Users can view teams in their department or teams they belong to"
ON public.client_teams
FOR SELECT
USING (
  department_id = get_user_department(auth.uid()) 
  OR id IN (SELECT get_user_team_ids(auth.uid()))
);

CREATE POLICY "Users can create teams in their department"
ON public.client_teams
FOR INSERT
WITH CHECK (
  department_id = get_user_department(auth.uid())
  AND get_user_role(auth.uid()) IN ('admin', 'partner', 'manager', 'employee')
);

CREATE POLICY "Users can update teams in their department or teams they lead"
ON public.client_teams
FOR UPDATE
USING (
  department_id = get_user_department(auth.uid())
  OR team_lead_id = auth.uid()
);

CREATE POLICY "Users can delete teams in their department"
ON public.client_teams
FOR DELETE
USING (
  department_id = get_user_department(auth.uid())
  AND get_user_role(auth.uid()) IN ('admin', 'partner', 'manager')
);

-- Create new clean policies for client_audit_actions
CREATE POLICY "Users can view client audit actions for accessible clients"
ON public.client_audit_actions
FOR SELECT
USING (
  client_id IN (
    SELECT c.id FROM clients c 
    WHERE c.department_id = get_user_department(auth.uid())
  )
  OR client_id IN (
    SELECT ct.client_id FROM client_teams ct 
    WHERE ct.id IN (SELECT get_user_team_ids(auth.uid()))
  )
  OR get_user_role(auth.uid()) IN ('admin', 'partner')
);

CREATE POLICY "Users can create client audit actions for accessible clients"
ON public.client_audit_actions
FOR INSERT
WITH CHECK (
  client_id IN (
    SELECT c.id FROM clients c 
    WHERE c.department_id = get_user_department(auth.uid())
  )
  OR client_id IN (
    SELECT ct.client_id FROM client_teams ct 
    WHERE ct.id IN (SELECT get_user_team_ids(auth.uid()))
  )
  OR get_user_role(auth.uid()) IN ('admin', 'partner')
);

CREATE POLICY "Users can update client audit actions for accessible clients"
ON public.client_audit_actions
FOR UPDATE
USING (
  client_id IN (
    SELECT c.id FROM clients c 
    WHERE c.department_id = get_user_department(auth.uid())
  )
  OR client_id IN (
    SELECT ct.client_id FROM client_teams ct 
    WHERE ct.id IN (SELECT get_user_team_ids(auth.uid()))
  )
  OR assigned_to = auth.uid()
  OR get_user_role(auth.uid()) IN ('admin', 'partner')
);

CREATE POLICY "Users can delete client audit actions for accessible clients"
ON public.client_audit_actions
FOR DELETE
USING (
  client_id IN (
    SELECT c.id FROM clients c 
    WHERE c.department_id = get_user_department(auth.uid())
  )
  OR client_id IN (
    SELECT ct.client_id FROM client_teams ct 
    WHERE ct.id IN (SELECT get_user_team_ids(auth.uid()))
  )
  OR get_user_role(auth.uid()) IN ('admin', 'partner')
);

-- Create new clean policies for audit_logs
CREATE POLICY "Users can view audit logs for accessible clients"
ON public.audit_logs
FOR SELECT
USING (
  client_id IN (
    SELECT c.id FROM clients c 
    WHERE c.department_id = get_user_department(auth.uid())
  )
  OR client_id IN (
    SELECT ct.client_id FROM client_teams ct 
    WHERE ct.id IN (SELECT get_user_team_ids(auth.uid()))
  )
  OR get_user_role(auth.uid()) IN ('admin', 'partner')
);

-- Create new clean policies for audit_action_recommendations
CREATE POLICY "Users can view recommendations for accessible clients"
ON public.audit_action_recommendations
FOR SELECT
USING (
  client_id IN (
    SELECT c.id FROM clients c 
    WHERE c.department_id = get_user_department(auth.uid())
  )
  OR client_id IN (
    SELECT ct.client_id FROM client_teams ct 
    WHERE ct.id IN (SELECT get_user_team_ids(auth.uid()))
  )
  OR get_user_role(auth.uid()) IN ('admin', 'partner')
);

CREATE POLICY "Users can manage recommendations for accessible clients"
ON public.audit_action_recommendations
FOR ALL
USING (
  client_id IN (
    SELECT c.id FROM clients c 
    WHERE c.department_id = get_user_department(auth.uid())
  )
  OR client_id IN (
    SELECT ct.client_id FROM client_teams ct 
    WHERE ct.id IN (SELECT get_user_team_ids(auth.uid()))
  )
  OR get_user_role(auth.uid()) IN ('admin', 'partner')
)
WITH CHECK (
  client_id IN (
    SELECT c.id FROM clients c 
    WHERE c.department_id = get_user_department(auth.uid())
  )
  OR client_id IN (
    SELECT ct.client_id FROM client_teams ct 
    WHERE ct.id IN (SELECT get_user_team_ids(auth.uid()))
  )
  OR get_user_role(auth.uid()) IN ('admin', 'partner')
);