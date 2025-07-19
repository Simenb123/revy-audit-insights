
-- Allow public read access to published knowledge articles and categories
-- This will enable AI Revi (running as guest) to access knowledge base

-- Update knowledge_articles RLS policy to allow public read access for published articles
DROP POLICY IF EXISTS "Published articles are public" ON public.knowledge_articles;
CREATE POLICY "Published articles are public"
  ON public.knowledge_articles
  FOR SELECT
  USING (status = 'published');

-- Update knowledge_categories RLS policy to allow public read access
DROP POLICY IF EXISTS "Categories are public" ON public.knowledge_categories;
CREATE POLICY "Categories are public"
  ON public.knowledge_categories
  FOR SELECT
  USING (true);

-- Ensure knowledge_article_tags are accessible for published articles
ALTER TABLE public.knowledge_article_tags ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Article tags are public for published articles" ON public.knowledge_article_tags;
CREATE POLICY "Article tags are public for published articles"
  ON public.knowledge_article_tags
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.knowledge_articles 
      WHERE id = knowledge_article_tags.article_id 
      AND status = 'published'
    )
  );

-- Ensure tags table is accessible
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tags are public" ON public.tags;
CREATE POLICY "Tags are public"
  ON public.tags
  FOR SELECT
  USING (true);
