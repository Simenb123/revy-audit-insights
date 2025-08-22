-- Add embedding columns for semantic search
ALTER TABLE public.legal_documents 
ADD COLUMN IF NOT EXISTS embedding extensions.vector(1536);

ALTER TABLE public.legal_provisions 
ADD COLUMN IF NOT EXISTS embedding extensions.vector(1536);

-- Create index for faster similarity search
CREATE INDEX IF NOT EXISTS legal_documents_embedding_idx 
ON public.legal_documents USING ivfflat (embedding extensions.vector_cosine_ops)
WITH (lists = 100);

CREATE INDEX IF NOT EXISTS legal_provisions_embedding_idx 
ON public.legal_provisions USING ivfflat (embedding extensions.vector_cosine_ops)
WITH (lists = 100);

-- Create RPC function for semantic search of legal documents
CREATE OR REPLACE FUNCTION public.match_legal_documents(
  query_embedding extensions.vector(1536),
  match_threshold double precision DEFAULT 0.7,
  match_count integer DEFAULT 10
)
RETURNS TABLE(
  id uuid,
  title text,
  content text,  
  document_number text,
  summary text,
  created_date date,
  last_updated date,
  is_active boolean,
  document_type_id uuid,
  document_type json,
  similarity double precision
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ld.id,
    ld.title,
    ld.content,
    ld.document_number,
    ld.summary,
    ld.created_date,
    ld.last_updated,
    ld.is_active,
    ld.document_type_id,
    json_build_object(
      'id', ldt.id,
      'name', ldt.name,
      'display_name', ldt.display_name,
      'hierarchy_level', ldt.hierarchy_level,
      'authority_weight', ldt.authority_weight
    ) as document_type,
    (1 - (ld.embedding <=> query_embedding))::double precision AS similarity
  FROM public.legal_documents ld
  LEFT JOIN public.legal_document_types ldt ON ld.document_type_id = ldt.id
  WHERE ld.is_active = true 
    AND ld.embedding IS NOT NULL 
    AND (1 - (ld.embedding <=> query_embedding)) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;

-- Create RPC function for semantic search of legal provisions
CREATE OR REPLACE FUNCTION public.match_legal_provisions(
  query_embedding extensions.vector(1536),
  match_threshold double precision DEFAULT 0.7,
  match_count integer DEFAULT 10
)
RETURNS TABLE(
  id uuid,
  title text,
  content text,
  provision_number text,
  law_identifier text,
  parent_provision_id uuid,
  is_active boolean,
  similarity double precision
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  RETURN QUERY
  SELECT
    lp.id,
    lp.title,
    lp.content,
    lp.provision_number,
    lp.law_identifier,
    lp.parent_provision_id,
    lp.is_active,
    (1 - (lp.embedding <=> query_embedding))::double precision AS similarity
  FROM public.legal_provisions lp
  WHERE lp.is_active = true 
    AND lp.embedding IS NOT NULL 
    AND (1 - (lp.embedding <=> query_embedding)) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;