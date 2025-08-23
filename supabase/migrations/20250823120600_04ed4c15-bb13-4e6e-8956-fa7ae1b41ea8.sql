-- Add annual employee count table for client data per fiscal year
CREATE TABLE public.client_annual_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  fiscal_year INTEGER NOT NULL,
  employee_count INTEGER,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  
  -- Ensure one record per client per fiscal year
  UNIQUE(client_id, fiscal_year)
);

-- Enable RLS
ALTER TABLE public.client_annual_data ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage annual data for their clients" 
ON public.client_annual_data 
FOR ALL 
USING (client_id IN (
  SELECT id FROM public.clients WHERE user_id = auth.uid()
));

-- Add updated_at trigger
CREATE TRIGGER update_client_annual_data_updated_at
  BEFORE UPDATE ON public.client_annual_data
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();