-- Fix vector extension and ensure match_knowledge_articles function works correctly
-- This should resolve the "operator does not exist: extensions.vector <=> extensions.vector" error

-- First, ensure the vector extension is properly loaded
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

-- Drop and recreate the match_knowledge_articles function with proper vector handling
DROP FUNCTION IF EXISTS public.match_knowledge_articles(extensions.vector, double precision, integer);

CREATE OR REPLACE FUNCTION public.match_knowledge_articles(
  p_query_embedding extensions.vector, 
  p_match_threshold double precision, 
  p_match_count integer
)
RETURNS TABLE(
  id uuid, 
  title text, 
  slug text, 
  summary text, 
  content text, 
  category_id uuid, 
  status article_status, 
  author_id uuid, 
  view_count integer, 
  created_at timestamp with time zone, 
  updated_at timestamp with time zone, 
  published_at timestamp with time zone, 
  category json, 
  similarity double precision, 
  reference_code text, 
  valid_from date, 
  valid_until date
)
LANGUAGE plpgsql
SET search_path TO ''
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ka.id,
    ka.title,
    ka.slug,
    ka.summary,
    ka.content,
    ka.category_id,
    ka.status,
    ka.author_id,
    ka.view_count,
    ka.created_at,
    ka.updated_at,
    ka.published_at,
    json_build_object('name', kc.name) as category,
    1 - (ka.embedding <=> p_query_embedding) AS similarity,
    ka.reference_code,
    ka.valid_from,
    ka.valid_until
  FROM public.knowledge_articles ka
  LEFT JOIN public.knowledge_categories kc ON ka.category_id = kc.id
  WHERE ka.status = 'published' 
    AND ka.embedding IS NOT NULL 
    AND (1 - (ka.embedding <=> p_query_embedding)) > p_match_threshold
  ORDER BY similarity DESC
  LIMIT p_match_count;
END;
$$;