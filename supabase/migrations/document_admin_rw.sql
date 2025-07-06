-- Restrict document management tables to admin role only

ALTER TABLE public.document_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_rw" ON public.document_types
  FOR ALL
  USING (auth.role() = 'admin')
  WITH CHECK (auth.role() = 'admin');

ALTER TABLE public.document_type_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_rw" ON public.document_type_categories
  FOR ALL
  USING (auth.role() = 'admin')
  WITH CHECK (auth.role() = 'admin');

ALTER TABLE public.document_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_rw" ON public.document_tags
  FOR ALL
  USING (auth.role() = 'admin')
  WITH CHECK (auth.role() = 'admin');

ALTER TABLE public.document_tag_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_rw" ON public.document_tag_assignments
  FOR ALL
  USING (auth.role() = 'admin')
  WITH CHECK (auth.role() = 'admin');

ALTER TABLE public.document_relationships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_rw" ON public.document_relationships
  FOR ALL
  USING (auth.role() = 'admin')
  WITH CHECK (auth.role() = 'admin');
