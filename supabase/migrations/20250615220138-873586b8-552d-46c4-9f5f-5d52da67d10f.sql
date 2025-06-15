
-- SQL to create cache table and helper function
CREATE TABLE public.ai_cache (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now() NOT NULL,
  request_hash text NOT NULL UNIQUE,
  response jsonb NOT NULL,
  model text NOT NULL,
  hits integer DEFAULT 1 NOT NULL,
  last_hit_at timestamptz DEFAULT now() NOT NULL,
  user_id uuid REFERENCES auth.users(id),
  client_id uuid REFERENCES clients(id)
);

COMMENT ON TABLE public.ai_cache IS 'Stores cached responses from AI interactions to reduce costs and latency.';
COMMENT ON COLUMN public.ai_cache.request_hash IS 'SHA-256 hash of the normalized request payload (message, context, client_id, userRole).';
COMMENT ON COLUMN public.ai_cache.hits IS 'Number of times the cached response has been served.';

CREATE INDEX idx_ai_cache_request_hash ON public.ai_cache(request_hash);
CREATE INDEX idx_ai_cache_user_client ON public.ai_cache(user_id, client_id);

CREATE OR REPLACE FUNCTION public.increment_cache_hit(hash_to_update text)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.ai_cache
  SET
    hits = hits + 1,
    last_hit_at = now()
  WHERE request_hash = hash_to_update;
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_cache_hit(text) TO authenticated;
