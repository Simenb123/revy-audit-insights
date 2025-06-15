
-- This migration will be used to generate embeddings for existing articles
-- The actual embedding generation will be handled by the edge function
-- This just prepares the structure and adds a helper function

-- Add a function to mark articles that need embeddings
CREATE OR REPLACE FUNCTION public.queue_articles_for_embedding()
RETURNS TABLE(id uuid, title text, content text)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT id, title, content 
  FROM public.knowledge_articles 
  WHERE status = 'published' 
    AND embedding IS NULL
    AND (title IS NOT NULL AND content IS NOT NULL);
$$;

-- Grant execution rights
GRANT EXECUTE ON FUNCTION public.queue_articles_for_embedding() TO authenticated;

COMMENT ON FUNCTION public.queue_articles_for_embedding() IS 'Returns articles that need embeddings generated';
