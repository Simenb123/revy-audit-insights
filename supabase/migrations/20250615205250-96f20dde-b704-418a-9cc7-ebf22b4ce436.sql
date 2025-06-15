
-- Step 1: Add a UNIQUE constraint to the 'name' column in knowledge_categories.
-- This is required for the ON CONFLICT clause to work correctly and prevent duplicate category names.
-- Assuming the previous transaction was rolled back, this constraint doesn't exist yet.
ALTER TABLE public.knowledge_categories
ADD CONSTRAINT knowledge_categories_name_key UNIQUE (name);

-- Step 2: Add a column to knowledge_categories to link them to specific audit phases.
ALTER TABLE public.knowledge_categories
ADD COLUMN IF NOT EXISTS applicable_phases audit_phase[];

COMMENT ON COLUMN public.knowledge_categories.applicable_phases IS 'Array of audit phases this category is relevant for.';

-- Step 3: Add columns to knowledge_articles for more structured metadata.
ALTER TABLE public.knowledge_articles
ADD COLUMN IF NOT EXISTS reference_code TEXT,
ADD COLUMN IF NOT EXISTS valid_from DATE,
ADD COLUMN IF NOT EXISTS valid_until DATE;

COMMENT ON COLUMN public.knowledge_articles.reference_code IS 'A specific code for the article, e.g., "ISA 200" or "Aksjeloven § 5-4".';
COMMENT ON COLUMN public.knowledge_articles.valid_from IS 'The date from which the article content is valid.';
COMMENT ON COLUMN public.knowledge_articles.valid_until IS 'The date until which the article content is valid (if applicable).';

-- Step 4: Insert the new top-level categories for structuring the knowledge base.
INSERT INTO public.knowledge_categories (name, description, display_order, icon)
VALUES
  ('Lover', 'Relevante lover og forskrifter for revisorer.', 10, 'Scale'),
  ('Revisjonsstandarder', 'ISA, ISQM, og andre revisjonsstandarder.', 20, 'BookCheck'),
  ('Regnskapsstandarder', 'NRS, IFRS, og andre relevante regnskapsstandarder.', 30, 'BookCopy'),
  ('Fagartikler', 'Faglige artikler, veiledninger og beste praksis.', 40, 'Newspaper'),
  ('Forarbeider og Dommer', 'Forarbeider til lover og relevante rettsavgjørelser.', 50, 'Gavel')
ON CONFLICT (name) DO NOTHING;

-- Step 5: Drop the existing function. This is the fix for the previous error.
DROP FUNCTION IF EXISTS public.match_knowledge_articles(extensions.vector, double precision, integer);

-- Step 6: Recreate the database function for semantic search with the new fields.
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
  similarity float,
  reference_code text,
  valid_from date,
  valid_until date
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
    1 - (ka.embedding <=> p_query_embedding) AS similarity,
    ka.reference_code,
    ka.valid_from,
    ka.valid_until
  FROM public.knowledge_articles ka
  LEFT JOIN public.knowledge_categories kc ON ka.category_id = kc.id
  WHERE ka.status = 'published' AND ka.embedding IS NOT NULL AND 1 - (ka.embedding <=> p_query_embedding) > p_match_threshold
  ORDER BY similarity DESC
  LIMIT p_match_count;
END;
$$;
