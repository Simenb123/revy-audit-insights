CREATE POLICY team_ins ON public.isa_standards
  FOR INSERT USING (auth.role() IN ('admin','firm_member'))
  WITH CHECK (auth.role() IN ('admin','firm_member'));

CREATE POLICY team_ins ON public.document_requirements
  FOR INSERT USING (auth.role() IN ('admin','firm_member'))
  WITH CHECK (auth.role() IN ('admin','firm_member'));

CREATE POLICY team_ins ON public.audit_action_isa_mappings
  FOR INSERT USING (auth.role() IN ('admin','firm_member'))
  WITH CHECK (auth.role() IN ('admin','firm_member'));

CREATE POLICY team_ins ON public.audit_action_document_mappings
  FOR INSERT USING (auth.role() IN ('admin','firm_member'))
  WITH CHECK (auth.role() IN ('admin','firm_member'));

CREATE POLICY team_ins ON public.action_ai_metadata
  FOR INSERT USING (auth.role() IN ('admin','firm_member'))
  WITH CHECK (auth.role() IN ('admin','firm_member'));
