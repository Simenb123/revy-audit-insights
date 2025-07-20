
-- Add potential clients table for companies found in BRREG but not yet registered as clients
CREATE TABLE public.potential_clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_number TEXT NOT NULL,
  company_name TEXT NOT NULL,
  auditor_org_number TEXT NOT NULL,
  auditor_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'potential' CHECK (status IN ('potential', 'declined', 'converted', 'lost')),
  discovered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  converted_to_client_id UUID REFERENCES public.clients(id),
  notes TEXT,
  contact_info JSONB DEFAULT '{}'::jsonb,
  brreg_data JSONB DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(org_number, auditor_org_number)
);

-- Add client history log for tracking all changes to client data
CREATE TABLE public.client_history_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  change_type TEXT NOT NULL CHECK (change_type IN ('created', 'updated', 'role_change', 'auditor_change', 'contact_change', 'brreg_sync')),
  field_name TEXT,
  old_value TEXT,
  new_value TEXT,
  change_source TEXT NOT NULL DEFAULT 'manual' CHECK (change_source IN ('manual', 'brreg_sync', 'bulk_import', 'system')),
  changed_by UUID REFERENCES auth.users(id),
  change_metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  description TEXT
);

-- Add client auditor history for tracking auditor changes over time
CREATE TABLE public.client_auditor_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  auditor_org_number TEXT NOT NULL,
  auditor_name TEXT NOT NULL,
  auditor_type TEXT CHECK (auditor_type IN ('revisor', 'regnskapsf??rer', 'autorisert_regnskapsf??rer')),
  valid_from DATE NOT NULL,
  valid_to DATE,
  is_current BOOLEAN NOT NULL DEFAULT true,
  discovered_via TEXT DEFAULT 'brreg_sync' CHECK (discovered_via IN ('brreg_sync', 'manual_entry', 'bulk_import')),
  brreg_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add bulk import sessions table to track bulk operations
CREATE TABLE public.bulk_import_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_type TEXT NOT NULL CHECK (session_type IN ('brreg_bulk_discovery', 'client_sync', 'potential_client_import')),
  auditor_org_number TEXT NOT NULL,
  auditor_name TEXT,
  total_found INTEGER DEFAULT 0,
  new_potential_clients INTEGER DEFAULT 0,
  updated_clients INTEGER DEFAULT 0,
  lost_clients INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed', 'cancelled')),
  started_by UUID REFERENCES auth.users(id),
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  session_data JSONB DEFAULT '{}'::jsonb
);

-- Extend clients table with auditor tracking fields
ALTER TABLE public.clients 
ADD COLUMN current_auditor_org_number TEXT,
ADD COLUMN current_auditor_name TEXT,
ADD COLUMN auditor_since DATE,
ADD COLUMN previous_auditor TEXT,
ADD COLUMN last_brreg_sync_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN brreg_sync_version INTEGER DEFAULT 1;

-- Add updated_at triggers
CREATE TRIGGER potential_clients_updated_at 
  BEFORE UPDATE ON public.potential_clients 
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER client_auditor_history_updated_at 
  BEFORE UPDATE ON public.client_auditor_history 
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Enable RLS on new tables
ALTER TABLE public.potential_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_history_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_auditor_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bulk_import_sessions ENABLE ROW LEVEL SECURITY;

-- RLS policies for potential_clients
CREATE POLICY "Users can manage potential clients for their firm" 
  ON public.potential_clients 
  FOR ALL 
  USING (auditor_org_number IN (SELECT org_number FROM audit_firms WHERE id = get_user_firm(auth.uid())));

-- RLS policies for client_history_log
CREATE POLICY "Users can view history for their clients" 
  ON public.client_history_log 
  FOR SELECT 
  USING (client_id IN (SELECT id FROM clients WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert history for their clients" 
  ON public.client_history_log 
  FOR INSERT 
  WITH CHECK (client_id IN (SELECT id FROM clients WHERE user_id = auth.uid()));

-- RLS policies for client_auditor_history
CREATE POLICY "Users can manage auditor history for their clients" 
  ON public.client_auditor_history 
  FOR ALL 
  USING (client_id IN (SELECT id FROM clients WHERE user_id = auth.uid()));

-- RLS policies for bulk_import_sessions
CREATE POLICY "Users can manage their own bulk import sessions" 
  ON public.bulk_import_sessions 
  FOR ALL 
  USING (started_by = auth.uid() OR auditor_org_number IN (SELECT org_number FROM audit_firms WHERE id = get_user_firm(auth.uid())));

-- Add indexes for performance
CREATE INDEX idx_potential_clients_auditor ON public.potential_clients(auditor_org_number, status);
CREATE INDEX idx_potential_clients_org_number ON public.potential_clients(org_number);
CREATE INDEX idx_client_history_log_client ON public.client_history_log(client_id, created_at DESC);
CREATE INDEX idx_client_auditor_history_client ON public.client_auditor_history(client_id, is_current);
CREATE INDEX idx_bulk_import_sessions_user ON public.bulk_import_sessions(started_by, started_at DESC);

-- Function to log client changes automatically
CREATE OR REPLACE FUNCTION public.log_client_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only log if this is an UPDATE
  IF TG_OP = 'UPDATE' THEN
    -- Log CEO change
    IF OLD.ceo IS DISTINCT FROM NEW.ceo THEN
      INSERT INTO public.client_history_log (
        client_id, change_type, field_name, old_value, new_value, 
        changed_by, change_source, description
      ) VALUES (
        NEW.id, 'role_change', 'ceo', OLD.ceo, NEW.ceo,
        auth.uid(), 'brreg_sync', 'CEO endret fra BRREG-synkronisering'
      );
    END IF;
    
    -- Log Chair change
    IF OLD.chair IS DISTINCT FROM NEW.chair THEN
      INSERT INTO public.client_history_log (
        client_id, change_type, field_name, old_value, new_value, 
        changed_by, change_source, description
      ) VALUES (
        NEW.id, 'role_change', 'chair', OLD.chair, NEW.chair,
        auth.uid(), 'brreg_sync', 'Styreleder endret fra BRREG-synkronisering'
      );
    END IF;
    
    -- Log auditor change
    IF OLD.current_auditor_name IS DISTINCT FROM NEW.current_auditor_name THEN
      INSERT INTO public.client_history_log (
        client_id, change_type, field_name, old_value, new_value, 
        changed_by, change_source, description
      ) VALUES (
        NEW.id, 'auditor_change', 'current_auditor_name', OLD.current_auditor_name, NEW.current_auditor_name,
        auth.uid(), 'brreg_sync', 'Revisor endret fra BRREG-synkronisering'
      );
    END IF;
    
    -- Update sync timestamp
    NEW.last_brreg_sync_at = now();
    NEW.brreg_sync_version = COALESCE(OLD.brreg_sync_version, 0) + 1;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Add trigger to clients table for automatic logging
CREATE TRIGGER log_client_changes_trigger
  BEFORE UPDATE ON public.clients
  FOR EACH ROW
  EXECUTE FUNCTION public.log_client_change();

-- Function to mark auditor history as not current when client changes auditor
CREATE OR REPLACE FUNCTION public.update_auditor_history()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Mark previous auditor history as not current
  IF TG_OP = 'UPDATE' AND OLD.current_auditor_org_number IS DISTINCT FROM NEW.current_auditor_org_number THEN
    UPDATE public.client_auditor_history
    SET is_current = false, valid_to = CURRENT_DATE, updated_at = now()
    WHERE client_id = NEW.id AND is_current = true;
    
    -- Insert new auditor history record if we have auditor info
    IF NEW.current_auditor_org_number IS NOT NULL THEN
      INSERT INTO public.client_auditor_history (
        client_id, auditor_org_number, auditor_name, valid_from, is_current
      ) VALUES (
        NEW.id, NEW.current_auditor_org_number, NEW.current_auditor_name, 
        COALESCE(NEW.auditor_since, CURRENT_DATE), true
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Add trigger for auditor history updates
CREATE TRIGGER update_auditor_history_trigger
  AFTER UPDATE ON public.clients
  FOR EACH ROW
  EXECUTE FUNCTION public.update_auditor_history();

-- Function to get potential clients for an auditor
CREATE OR REPLACE FUNCTION public.get_potential_clients_summary(p_auditor_org_number TEXT)
RETURNS TABLE(
  total_potential INTEGER,
  new_this_month INTEGER,
  converted_count INTEGER,
  lost_count INTEGER
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    COUNT(*) FILTER (WHERE status = 'potential')::INTEGER as total_potential,
    COUNT(*) FILTER (WHERE status = 'potential' AND discovered_at >= date_trunc('month', CURRENT_DATE))::INTEGER as new_this_month,
    COUNT(*) FILTER (WHERE status = 'converted')::INTEGER as converted_count,
    COUNT(*) FILTER (WHERE status = 'lost')::INTEGER as lost_count
  FROM public.potential_clients 
  WHERE auditor_org_number = p_auditor_org_number;
$$;
