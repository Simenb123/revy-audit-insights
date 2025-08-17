-- Create A07 account mappings table
CREATE TABLE public.a07_account_mappings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL,
  account_number TEXT NOT NULL,
  a07_performance_code TEXT NOT NULL,
  mapping_description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID,
  UNIQUE(client_id, account_number, a07_performance_code)
);

-- Enable RLS
ALTER TABLE public.a07_account_mappings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage A07 mappings for their clients" 
ON public.a07_account_mappings 
FOR ALL 
USING (client_id IN (SELECT id FROM clients WHERE user_id = auth.uid()))
WITH CHECK (client_id IN (SELECT id FROM clients WHERE user_id = auth.uid()));

-- Add trigger for updated_at
CREATE TRIGGER update_a07_account_mappings_updated_at
BEFORE UPDATE ON public.a07_account_mappings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();