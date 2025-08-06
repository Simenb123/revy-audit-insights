-- Create table for account classifications
CREATE TABLE public.account_classifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL,
  account_number TEXT NOT NULL,
  original_category TEXT NOT NULL,
  new_category TEXT NOT NULL,
  classification_type TEXT NOT NULL DEFAULT 'manual', -- 'manual', 'rule', 'bulk'
  applied_by UUID REFERENCES auth.users(id),
  applied_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  version_id UUID REFERENCES public.accounting_data_versions(id),
  UNIQUE(client_id, account_number, version_id, is_active)
);

-- Enable RLS
ALTER TABLE public.account_classifications ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage classifications for their clients" 
ON public.account_classifications 
FOR ALL 
USING (client_id IN (
  SELECT id FROM public.clients WHERE user_id = auth.uid()
));

-- Create index for better performance
CREATE INDEX idx_account_classifications_client_version 
ON public.account_classifications(client_id, version_id, is_active);

-- Create trigger for updated_at
CREATE TRIGGER update_account_classifications_updated_at
BEFORE UPDATE ON public.account_classifications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();