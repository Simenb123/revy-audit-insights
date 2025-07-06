-- Allow firm members to insert internal audit requirements and mappings

-- ISA standards
DROP POLICY IF EXISTS "Firm users can insert ISA standards" ON public.isa_standards;
CREATE POLICY "Firm users can insert ISA standards"
  ON public.isa_standards
  FOR INSERT
  USING (auth.role() IN ('admin', 'firm_member'))
  WITH CHECK (auth.role() IN ('admin', 'firm_member'));

-- Document requirements
DROP POLICY IF EXISTS "Firm users can insert document requirements" ON public.document_requirements;
CREATE POLICY "Firm users can insert document requirements"
  ON public.document_requirements
  FOR INSERT
  USING (auth.role() IN ('admin', 'firm_member'))
  WITH CHECK (auth.role() IN ('admin', 'firm_member'));

-- Action ISA mappings
DROP POLICY IF EXISTS "Firm users can insert action ISA mappings" ON public.audit_action_isa_mappings;
CREATE POLICY "Firm users can insert action ISA mappings"
  ON public.audit_action_isa_mappings
  FOR INSERT
  USING (auth.role() IN ('admin', 'firm_member'))
  WITH CHECK (auth.role() IN ('admin', 'firm_member'));

-- Action document mappings
DROP POLICY IF EXISTS "Firm users can insert action document mappings" ON public.audit_action_document_mappings;
CREATE POLICY "Firm users can insert action document mappings"
  ON public.audit_action_document_mappings
  FOR INSERT
  USING (auth.role() IN ('admin', 'firm_member'))
  WITH CHECK (auth.role() IN ('admin', 'firm_member'));

-- Action AI metadata
DROP POLICY IF EXISTS "Firm users can insert action AI metadata" ON public.action_ai_metadata;
CREATE POLICY "Firm users can insert action AI metadata"
  ON public.action_ai_metadata
  FOR INSERT
  USING (auth.role() IN ('admin', 'firm_member'))
  WITH CHECK (auth.role() IN ('admin', 'firm_member'));
