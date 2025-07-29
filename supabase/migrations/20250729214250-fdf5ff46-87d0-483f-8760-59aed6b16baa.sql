-- Create accounting data versions table
CREATE TABLE public.accounting_data_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  file_name TEXT NOT NULL,
  upload_batch_id UUID REFERENCES public.upload_batches(id),
  uploaded_by UUID REFERENCES auth.users(id),
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  total_transactions INTEGER NOT NULL DEFAULT 0,
  total_debit_amount NUMERIC(15,2) DEFAULT 0,
  total_credit_amount NUMERIC(15,2) DEFAULT 0,
  balance_difference NUMERIC(15,2) DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(client_id, version_number)
);

-- Add version_id to general_ledger_transactions
ALTER TABLE public.general_ledger_transactions 
ADD COLUMN version_id UUID REFERENCES public.accounting_data_versions(id) ON DELETE CASCADE;

-- Create index for better performance
CREATE INDEX idx_general_ledger_transactions_version_id ON public.general_ledger_transactions(version_id);
CREATE INDEX idx_accounting_data_versions_client_active ON public.accounting_data_versions(client_id, is_active);

-- Enable RLS on accounting_data_versions
ALTER TABLE public.accounting_data_versions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for accounting_data_versions
CREATE POLICY "Users can manage versions for their clients" 
ON public.accounting_data_versions 
FOR ALL 
USING (client_id IN (
  SELECT id FROM public.clients WHERE user_id = auth.uid()
));

-- Function to get next version number
CREATE OR REPLACE FUNCTION public.get_next_version_number(p_client_id UUID)
RETURNS INTEGER
LANGUAGE SQL
STABLE SECURITY DEFINER
AS $$
  SELECT COALESCE(MAX(version_number), 0) + 1 
  FROM public.accounting_data_versions 
  WHERE client_id = p_client_id;
$$;

-- Function to set active version (deactivate others first)
CREATE OR REPLACE FUNCTION public.set_active_version(p_version_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  p_client_id UUID;
BEGIN
  -- Get client_id from the version
  SELECT client_id INTO p_client_id 
  FROM public.accounting_data_versions 
  WHERE id = p_version_id;
  
  -- Deactivate all versions for this client
  UPDATE public.accounting_data_versions 
  SET is_active = false, updated_at = now()
  WHERE client_id = p_client_id;
  
  -- Activate the specified version
  UPDATE public.accounting_data_versions 
  SET is_active = true, updated_at = now()
  WHERE id = p_version_id;
END;
$$;

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_accounting_data_versions_updated_at
  BEFORE UPDATE ON public.accounting_data_versions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();