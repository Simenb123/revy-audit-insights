-- Allow employees access to admin policies
-- Update RLS policies to include the employee role

ALTER POLICY "Users can view relevant audit logs" ON public.audit_logs
  USING (
    client_id IN (
      SELECT c.id FROM public.clients c
      JOIN public.client_teams ct ON c.id = ct.client_id
      JOIN public.team_members tm ON ct.id = tm.team_id
      WHERE tm.user_id = auth.uid() AND tm.is_active = true
    ) OR
    public.get_user_role(auth.uid()) IN ('admin', 'partner', 'employee')
  );

ALTER POLICY "Brukere kan se versjoner for sitt firma" ON public.document_versions
  USING (
    get_user_firm(auth.uid()) = (
        SELECT d.audit_firm_id
        FROM public.client_audit_actions caa
        JOIN public.clients c ON caa.client_id = c.id
        LEFT JOIN public.departments d ON c.department_id = d.id
        WHERE caa.id = document_versions.client_audit_action_id
    ) OR get_user_role(auth.uid()) IN ('admin', 'partner', 'employee')
  );

ALTER POLICY "Brukere kan opprette versjoner for sitt firma" ON public.document_versions
  WITH CHECK (
  created_by_user_id = auth.uid() AND
  ((
    get_user_firm(auth.uid()) = (
        SELECT d.audit_firm_id
        FROM public.client_audit_actions caa
        JOIN public.clients c ON caa.client_id = c.id
        LEFT JOIN public.departments d ON c.department_id = d.id
        WHERE caa.id = document_versions.client_audit_action_id
    )
  ) OR get_user_role(auth.uid()) IN ('admin', 'partner', 'employee'))
  );

ALTER POLICY "Users can view client actions for their accessible clients" ON public.client_audit_actions
  USING (
    client_id IN (
      SELECT c.id FROM public.clients c
      WHERE c.department_id = public.get_user_department(auth.uid()) OR
      c.id IN (
        SELECT ct.client_id FROM public.client_teams ct
        JOIN public.team_members tm ON ct.id = tm.team_id
        WHERE tm.user_id = auth.uid() AND tm.is_active = true
      )
    ) OR
    public.get_user_role(auth.uid()) IN ('admin', 'partner', 'employee') OR
    assigned_to = auth.uid()
  );

ALTER POLICY "Users can update client actions for accessible clients" ON public.client_audit_actions
  USING (
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
    public.get_user_role(auth.uid()) IN ('admin', 'partner', 'employee')
  );

ALTER POLICY "Users can update templates in their firm" ON public.audit_action_templates
  USING (
    audit_firm_id = public.get_user_firm(auth.uid()) AND
    (created_by = auth.uid() OR public.get_user_role(auth.uid()) IN ('admin', 'partner', 'employee'))
  );

ALTER POLICY "Admins can manage learning paths" ON public.learning_paths
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND user_role IN ('admin', 'partner', 'employee')
    )
  );

ALTER POLICY "Managers can view enrollments in their firm" ON public.user_learning_enrollments
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p1
      JOIN public.profiles p2 ON p1.audit_firm_id = p2.audit_firm_id
      WHERE p1.id = auth.uid()
      AND p2.id = user_id
      AND p1.user_role IN ('admin', 'partner', 'manager', 'employee')
    )
  );

ALTER POLICY "Managers can create enrollments" ON public.user_learning_enrollments
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND user_role IN ('admin', 'partner', 'manager', 'employee')
    )
  );

ALTER POLICY "Managers can view completions in their firm" ON public.user_module_completions
  USING (
    EXISTS (
      SELECT 1 FROM public.user_learning_enrollments ule
      JOIN public.profiles p1 ON ule.user_id = p1.id
      JOIN public.profiles p2 ON p1.audit_firm_id = p2.audit_firm_id
      WHERE ule.id = enrollment_id
      AND p2.id = auth.uid()
      AND p2.user_role IN ('admin', 'partner', 'manager', 'employee')
    )
  );

ALTER POLICY "Users can create audit action templates" ON public.audit_action_templates
  WITH CHECK (
    auth.uid() = created_by OR
    auth.uid() IN (
      SELECT p.id FROM profiles p
      WHERE p.user_role IN ('admin', 'partner', 'manager', 'employee')
    )
  );

ALTER POLICY "Users can view audit action templates" ON public.audit_action_templates
  USING (
    is_system_template = true OR
    auth.uid() = created_by OR
    auth.uid() IN (
      SELECT p.id FROM profiles p
      WHERE p.user_role IN ('admin', 'partner', 'manager', 'employee')
    )
  );

ALTER POLICY "Users can update their own audit action templates" ON public.audit_action_templates
  USING (
    auth.uid() = created_by OR
    auth.uid() IN (
      SELECT p.id FROM profiles p
      WHERE p.user_role IN ('admin', 'partner', 'manager', 'employee')
    )
  );

ALTER POLICY "Users can delete their own audit action templates" ON public.audit_action_templates
  USING (
    auth.uid() = created_by OR
    auth.uid() IN (
      SELECT p.id FROM profiles p
      WHERE p.user_role IN ('admin', 'partner', 'manager', 'employee')
    )
  );
