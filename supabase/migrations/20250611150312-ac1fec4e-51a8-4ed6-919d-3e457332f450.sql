
-- Add RLS policies for client_audit_actions table with proper field mapping
CREATE POLICY "Users can view client actions for their accessible clients" ON public.client_audit_actions
  FOR SELECT USING (
    client_id IN (
      SELECT c.id FROM public.clients c
      WHERE c.department_id = public.get_user_department(auth.uid()) OR
      c.id IN (
        SELECT ct.client_id FROM public.client_teams ct
        JOIN public.team_members tm ON ct.id = tm.team_id
        WHERE tm.user_id = auth.uid() AND tm.is_active = true
      )
    ) OR
    public.get_user_role(auth.uid()) IN ('admin', 'partner') OR
    assigned_to = auth.uid()
  );

CREATE POLICY "Users can create client actions for accessible clients" ON public.client_audit_actions
  FOR INSERT WITH CHECK (
    client_id IN (
      SELECT c.id FROM public.clients c
      WHERE c.department_id = public.get_user_department(auth.uid()) OR
      c.id IN (
        SELECT ct.client_id FROM public.client_teams ct
        JOIN public.team_members tm ON ct.id = tm.team_id
        WHERE tm.user_id = auth.uid() AND tm.is_active = true
      )
    )
  );

CREATE POLICY "Users can update client actions for accessible clients" ON public.client_audit_actions
  FOR UPDATE USING (
    client_id IN (
      SELECT c.id FROM public.clients c
      WHERE c.department_id = public.get_user_department(auth.uid()) OR
      c.id IN (
        SELECT ct.client_id FROM public.client_teams ct
        JOIN public.team_members tm ON ct.id = tm.team_id
        WHERE tm.user_id = auth.uid() AND tm.is_active = true
      )
    ) OR
    assigned_to = auth.uid() OR
    public.get_user_role(auth.uid()) IN ('admin', 'partner')
  );

-- Add copied_from tracking fields to client_audit_actions
ALTER TABLE public.client_audit_actions 
ADD COLUMN IF NOT EXISTS copied_from_client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS copied_from_action_id UUID REFERENCES public.client_audit_actions(id) ON DELETE SET NULL;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_client_audit_actions_copied_from ON public.client_audit_actions(copied_from_client_id);
CREATE INDEX IF NOT EXISTS idx_client_audit_actions_assigned_to ON public.client_audit_actions(assigned_to);

-- Add RLS policies for audit_action_templates
DROP POLICY IF EXISTS "Users can view templates in their firm" ON public.audit_action_templates;
CREATE POLICY "Users can view templates in their firm" ON public.audit_action_templates
  FOR SELECT USING (
    audit_firm_id = public.get_user_firm(auth.uid()) OR 
    is_system_template = true OR
    audit_firm_id IS NULL
  );

DROP POLICY IF EXISTS "Users can create templates in their firm" ON public.audit_action_templates;
CREATE POLICY "Users can create templates in their firm" ON public.audit_action_templates
  FOR INSERT WITH CHECK (
    audit_firm_id = public.get_user_firm(auth.uid()) AND
    created_by = auth.uid()
  );

DROP POLICY IF EXISTS "Users can update templates in their firm" ON public.audit_action_templates;
CREATE POLICY "Users can update templates in their firm" ON public.audit_action_templates
  FOR UPDATE USING (
    audit_firm_id = public.get_user_firm(auth.uid()) AND
    (created_by = auth.uid() OR public.get_user_role(auth.uid()) IN ('admin', 'partner'))
  );

-- Add RLS policies for action_groups
DROP POLICY IF EXISTS "Users can view groups in their firm" ON public.action_groups;
CREATE POLICY "Users can view groups in their firm" ON public.action_groups
  FOR SELECT USING (
    audit_firm_id = public.get_user_firm(auth.uid()) OR 
    is_system_group = true OR
    audit_firm_id IS NULL
  );

DROP POLICY IF EXISTS "Users can create groups in their firm" ON public.action_groups;
CREATE POLICY "Users can create groups in their firm" ON public.action_groups
  FOR INSERT WITH CHECK (
    audit_firm_id = public.get_user_firm(auth.uid()) AND
    created_by = auth.uid()
  );
