-- Create trial_balance_mappings table for client-specific account mappings
CREATE TABLE IF NOT EXISTS public.trial_balance_mappings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  account_number TEXT NOT NULL,
  statement_line_number TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(client_id, account_number)
);

-- Enable RLS
ALTER TABLE public.trial_balance_mappings ENABLE ROW LEVEL SECURITY;

-- Create policies for trial balance mappings
CREATE POLICY "Users can manage mappings for their clients" 
ON public.trial_balance_mappings 
FOR ALL 
USING (client_id IN (
  SELECT id FROM public.clients WHERE user_id = auth.uid()
));

-- Add trigger for updated_at
CREATE TRIGGER update_trial_balance_mappings_updated_at
  BEFORE UPDATE ON public.trial_balance_mappings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_trial_balance_mappings_client_account 
ON public.trial_balance_mappings(client_id, account_number);