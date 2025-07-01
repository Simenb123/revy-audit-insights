-- Add row level security policies for knowledge base tables

-- Enable RLS and public read access for knowledge categories
ALTER TABLE public.knowledge_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Categories are public" ON public.knowledge_categories;
CREATE POLICY "Categories are public"
  ON public.knowledge_categories
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Manage knowledge categories" ON public.knowledge_categories;
CREATE POLICY "Manage knowledge categories"
  ON public.knowledge_categories
  FOR ALL
  USING (public.get_user_role(auth.uid()) IN ('admin', 'partner', 'employee'))
  WITH CHECK (public.get_user_role(auth.uid()) IN ('admin', 'partner', 'employee'));

-- Ensure knowledge articles have write policies
ALTER TABLE public.knowledge_articles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Published articles are public" ON public.knowledge_articles;
CREATE POLICY "Published articles are public"
  ON public.knowledge_articles
  FOR SELECT
  USING (status = 'published');

DROP POLICY IF EXISTS "Manage knowledge articles" ON public.knowledge_articles;
CREATE POLICY "Manage knowledge articles"
  ON public.knowledge_articles
  FOR ALL
  USING (public.get_user_role(auth.uid()) IN ('admin', 'partner', 'employee'))
  WITH CHECK (public.get_user_role(auth.uid()) IN ('admin', 'partner', 'employee'));
