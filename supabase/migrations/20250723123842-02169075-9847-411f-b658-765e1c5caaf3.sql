-- Create potential_clients table for bulk discovery
CREATE TABLE IF NOT EXISTS public.potential_clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_number TEXT NOT NULL,
  company_name TEXT NOT NULL,
  auditor_org_number TEXT NOT NULL,
  auditor_name TEXT,
  status TEXT NOT NULL DEFAULT 'potential' CHECK (status IN ('potential', 'declined', 'converted', 'lost')),
  discovered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  converted_to_client_id UUID REFERENCES public.clients(id),
  notes TEXT,
  contact_info JSONB DEFAULT '{}',
  brreg_data JSONB DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create bulk_import_sessions table
CREATE TABLE IF NOT EXISTS public.bulk_import_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_type TEXT NOT NULL,
  auditor_org_number TEXT NOT NULL,
  auditor_name TEXT,
  total_found INTEGER DEFAULT 0,
  new_potential_clients INTEGER DEFAULT 0,
  updated_clients INTEGER DEFAULT 0,
  lost_clients INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed')),
  started_by UUID REFERENCES auth.users(id),
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  session_data JSONB DEFAULT '{}'
);

-- Enable RLS on both tables
ALTER TABLE public.potential_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bulk_import_sessions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for potential_clients
CREATE POLICY "Users can manage their potential clients" 
ON public.potential_clients 
FOR ALL 
USING (created_by = auth.uid());

-- Create RLS policies for bulk_import_sessions
CREATE POLICY "Users can manage their import sessions" 
ON public.bulk_import_sessions 
FOR ALL 
USING (started_by = auth.uid());

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_potential_clients_auditor_org ON public.potential_clients (auditor_org_number);
CREATE INDEX IF NOT EXISTS idx_potential_clients_org_number ON public.potential_clients (org_number);
CREATE INDEX IF NOT EXISTS idx_potential_clients_status ON public.potential_clients (status);
CREATE INDEX IF NOT EXISTS idx_potential_clients_created_by ON public.potential_clients (created_by);

CREATE INDEX IF NOT EXISTS idx_bulk_import_sessions_started_by ON public.bulk_import_sessions (started_by);
CREATE INDEX IF NOT EXISTS idx_bulk_import_sessions_auditor_org ON public.bulk_import_sessions (auditor_org_number);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_potential_clients_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_potential_clients_updated_at
  BEFORE UPDATE ON public.potential_clients
  FOR EACH ROW
  EXECUTE FUNCTION public.update_potential_clients_updated_at();