-- Create generated_vouchers table for PDF creator module
CREATE TABLE IF NOT EXISTS public.generated_vouchers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  bilag TEXT,
  doknr TEXT,
  type TEXT NOT NULL, -- BilagType
  dokumenttype TEXT, -- faktura/kreditnota
  storage_key TEXT NOT NULL,
  sha256 TEXT,
  file_size BIGINT,
  created_by UUID NOT NULL DEFAULT auth.uid(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.generated_vouchers ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view vouchers for their clients"
  ON public.generated_vouchers FOR SELECT
  USING (client_id IN (
    SELECT id FROM public.clients WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can insert vouchers for their clients"
  ON public.generated_vouchers FOR INSERT
  WITH CHECK (client_id IN (
    SELECT id FROM public.clients WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can update vouchers for their clients"
  ON public.generated_vouchers FOR UPDATE
  USING (client_id IN (
    SELECT id FROM public.clients WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can delete vouchers for their clients"
  ON public.generated_vouchers FOR DELETE
  USING (client_id IN (
    SELECT id FROM public.clients WHERE user_id = auth.uid()
  ));

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_generated_vouchers_client_id ON public.generated_vouchers(client_id);
CREATE INDEX IF NOT EXISTS idx_generated_vouchers_created_by ON public.generated_vouchers(created_by);
CREATE INDEX IF NOT EXISTS idx_generated_vouchers_type ON public.generated_vouchers(type);
CREATE INDEX IF NOT EXISTS idx_generated_vouchers_doknr ON public.generated_vouchers(doknr);

-- Update trigger
CREATE TRIGGER update_generated_vouchers_updated_at
  BEFORE UPDATE ON public.generated_vouchers
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();