-- Allow public read access to published knowledge articles
ALTER TABLE public.knowledge_articles ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Published articles are public" ON public.knowledge_articles;

CREATE POLICY "Published articles are public"
  ON public.knowledge_articles
  FOR SELECT
  USING (status = 'published');
