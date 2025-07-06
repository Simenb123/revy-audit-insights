-- Enable RLS for ai_cache table and restrict access to row owner

ALTER TABLE public.ai_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner_rw" ON public.ai_cache
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
