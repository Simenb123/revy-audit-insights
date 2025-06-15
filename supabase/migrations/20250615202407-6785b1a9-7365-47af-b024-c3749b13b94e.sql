
-- First, we need to enable the pgvector extension, which is specially designed for vector operations.
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

-- Next, we'll add a 'embedding' column to your knowledge_articles table.
-- This column will store the numerical representation (vector) of each article's content.
-- We use a dimension of 1536, which is standard for OpenAI's latest embedding models.
ALTER TABLE public.knowledge_articles
ADD COLUMN embedding extensions.vector(1536);

COMMENT ON COLUMN public.knowledge_articles.embedding IS 'Vector embedding for semantic search, generated from title and content.';

-- To make searching through these vectors fast, we'll create a special HNSW index.
-- This is a modern, high-performance index for similarity search. We use cosine similarity, which is great for text.
CREATE INDEX idx_knowledge_articles_embedding ON public.knowledge_articles USING hnsw (embedding extensions.vector_cosine_ops);

-- Finally, let's create a database function to find the most relevant articles.
-- This function takes a query vector and returns articles that are semantically similar.
CREATE OR REPLACE FUNCTION public.match_knowledge_articles (
  p_query_embedding extensions.vector(1536),
  p_match_threshold float,
  p_match_count int
)
RETURNS TABLE (
  id uuid,
  title text,
  slug text,
  summary text,
  content text,
  category_id uuid,
  status article_status,
  author_id uuid,
  tags text[],
  view_count integer,
  created_at timestamptz,
  updated_at timestamptz,
  published_at timestamptz,
  category json,
  similarity float
)
LANGUAGE plpgsql
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
    ka.tags,
    ka.view_count,
    ka.created_at,
    ka.updated_at,
    ka.published_at,
    json_build_object('name', kc.name) as category,
    1 - (ka.embedding <=> p_query_embedding) AS similarity
  FROM public.knowledge_articles ka
  LEFT JOIN public.knowledge_categories kc ON ka.category_id = kc.id
  WHERE ka.status = 'published' AND ka.embedding IS NOT NULL AND 1 - (ka.embedding <=> p_query_embedding) > p_match_threshold
  ORDER BY similarity DESC
  LIMIT p_match_count;
END;
$$;
