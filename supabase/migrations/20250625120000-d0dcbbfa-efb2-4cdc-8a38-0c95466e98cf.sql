-- Add upload_column_mappings table for storing column mapping per upload batch

CREATE TABLE IF NOT EXISTS public.upload_column_mappings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  upload_batch_id UUID NOT NULL REFERENCES public.upload_batches(id) ON DELETE CASCADE,
  column_mappings JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index for quick lookup by client
CREATE INDEX IF NOT EXISTS upload_column_mappings_client_idx
  ON public.upload_column_mappings (client_id);

