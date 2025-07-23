-- Fix infinite recursion in team_members RLS policies
-- First drop the problematic policies
DROP POLICY IF EXISTS "Users can view team members in their teams" ON public.team_members;
DROP POLICY IF EXISTS "Users can insert team members in their teams" ON public.team_members;
DROP POLICY IF EXISTS "Users can update team members in their teams" ON public.team_members;
DROP POLICY IF EXISTS "Users can delete team members in their teams" ON public.team_members;

-- Create a security definer function to get user's teams
CREATE OR REPLACE FUNCTION public.get_user_teams(user_uuid uuid)
RETURNS TABLE(team_id uuid)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $$
  SELECT tm.team_id 
  FROM public.team_members tm 
  WHERE tm.user_id = user_uuid AND tm.is_active = true;
$$;

-- Create non-recursive RLS policies for team_members
CREATE POLICY "Users can view team members in accessible teams" 
ON public.team_members 
FOR SELECT 
USING (
  team_id IN (
    SELECT ct.id 
    FROM public.client_teams ct 
    WHERE ct.department_id = get_user_department(auth.uid())
  )
  OR get_user_role(auth.uid()) = ANY (ARRAY['admin'::user_role_type, 'partner'::user_role_type])
);

CREATE POLICY "Managers can insert team members" 
ON public.team_members 
FOR INSERT 
WITH CHECK (
  get_user_role(auth.uid()) = ANY (ARRAY['admin'::user_role_type, 'partner'::user_role_type, 'manager'::user_role_type])
  AND team_id IN (
    SELECT ct.id 
    FROM public.client_teams ct 
    WHERE ct.department_id = get_user_department(auth.uid())
  )
);

CREATE POLICY "Managers can update team members" 
ON public.team_members 
FOR UPDATE 
USING (
  get_user_role(auth.uid()) = ANY (ARRAY['admin'::user_role_type, 'partner'::user_role_type, 'manager'::user_role_type])
  AND team_id IN (
    SELECT ct.id 
    FROM public.client_teams ct 
    WHERE ct.department_id = get_user_department(auth.uid())
  )
);

CREATE POLICY "Managers can delete team members" 
ON public.team_members 
FOR DELETE 
USING (
  get_user_role(auth.uid()) = ANY (ARRAY['admin'::user_role_type, 'partner'::user_role_type, 'manager'::user_role_type])
  AND team_id IN (
    SELECT ct.id 
    FROM public.client_teams ct 
    WHERE ct.department_id = get_user_department(auth.uid())
  )
);

-- Create client_history_logs table for change tracking
CREATE TABLE IF NOT EXISTS public.client_history_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  change_type TEXT NOT NULL CHECK (change_type IN ('created', 'updated', 'role_change', 'auditor_change', 'contact_change', 'brreg_sync')),
  field_name TEXT,
  old_value TEXT,
  new_value TEXT,
  change_source TEXT NOT NULL DEFAULT 'manual' CHECK (change_source IN ('manual', 'brreg_sync', 'bulk_import', 'system')),
  changed_by UUID REFERENCES auth.users(id),
  change_metadata JSONB DEFAULT '{}',
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create client_auditor_history table for auditor tracking
CREATE TABLE IF NOT EXISTS public.client_auditor_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  auditor_org_number TEXT NOT NULL,
  auditor_name TEXT,
  auditor_type TEXT CHECK (auditor_type IN ('revisor', 'regnskapsfører', 'autorisert_regnskapsfører')),
  valid_from DATE NOT NULL,
  valid_to DATE,
  is_current BOOLEAN NOT NULL DEFAULT true,
  discovered_via TEXT NOT NULL DEFAULT 'manual_entry' CHECK (discovered_via IN ('brreg_sync', 'manual_entry', 'bulk_import')),
  brreg_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add new columns to clients table for better BRREG data
ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS current_auditor_org_number TEXT,
ADD COLUMN IF NOT EXISTS current_auditor_name TEXT,
ADD COLUMN IF NOT EXISTS auditor_since DATE,
ADD COLUMN IF NOT EXISTS previous_auditor TEXT,
ADD COLUMN IF NOT EXISTS last_brreg_sync_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS brreg_sync_version INTEGER DEFAULT 1;

-- Extend client_roles table with more detailed information
ALTER TABLE public.client_roles 
ADD COLUMN IF NOT EXISTS person_id TEXT,
ADD COLUMN IF NOT EXISTS org_number TEXT,
ADD COLUMN IF NOT EXISTS role_description TEXT,
ADD COLUMN IF NOT EXISTS is_current BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS discovered_via TEXT DEFAULT 'manual_entry' CHECK (discovered_via IN ('brreg_sync', 'manual_entry', 'bulk_import')),
ADD COLUMN IF NOT EXISTS brreg_data JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Enable RLS on new tables
ALTER TABLE public.client_history_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_auditor_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for client_history_logs
CREATE POLICY "Users can view client history for accessible clients" 
ON public.client_history_logs 
FOR SELECT 
USING (
  client_id IN (
    SELECT c.id 
    FROM public.clients c 
    WHERE c.department_id = get_user_department(auth.uid())
       OR c.id IN (
         SELECT ct.client_id 
         FROM public.client_teams ct 
         JOIN public.team_members tm ON ct.id = tm.team_id 
         WHERE tm.user_id = auth.uid() AND tm.is_active = true
       )
  )
  OR get_user_role(auth.uid()) = ANY (ARRAY['admin'::user_role_type, 'partner'::user_role_type])
);

CREATE POLICY "System can insert client history" 
ON public.client_history_logs 
FOR INSERT 
WITH CHECK (true);

-- Create RLS policies for client_auditor_history
CREATE POLICY "Users can view auditor history for accessible clients" 
ON public.client_auditor_history 
FOR SELECT 
USING (
  client_id IN (
    SELECT c.id 
    FROM public.clients c 
    WHERE c.department_id = get_user_department(auth.uid())
       OR c.id IN (
         SELECT ct.client_id 
         FROM public.client_teams ct 
         JOIN public.team_members tm ON ct.id = tm.team_id 
         WHERE tm.user_id = auth.uid() AND tm.is_active = true
       )
  )
  OR get_user_role(auth.uid()) = ANY (ARRAY['admin'::user_role_type, 'partner'::user_role_type])
);

CREATE POLICY "System can manage auditor history" 
ON public.client_auditor_history 
FOR ALL 
USING (
  client_id IN (
    SELECT c.id 
    FROM public.clients c 
    WHERE c.department_id = get_user_department(auth.uid())
       OR c.id IN (
         SELECT ct.client_id 
         FROM public.client_teams ct 
         JOIN public.team_members tm ON ct.id = tm.team_id 
         WHERE tm.user_id = auth.uid() AND tm.is_active = true
       )
  )
  OR get_user_role(auth.uid()) = ANY (ARRAY['admin'::user_role_type, 'partner'::user_role_type])
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_client_history_logs_client_id ON public.client_history_logs (client_id);
CREATE INDEX IF NOT EXISTS idx_client_history_logs_change_type ON public.client_history_logs (change_type);
CREATE INDEX IF NOT EXISTS idx_client_history_logs_created_at ON public.client_history_logs (created_at);

CREATE INDEX IF NOT EXISTS idx_client_auditor_history_client_id ON public.client_auditor_history (client_id);
CREATE INDEX IF NOT EXISTS idx_client_auditor_history_current ON public.client_auditor_history (is_current);
CREATE INDEX IF NOT EXISTS idx_client_auditor_history_org_number ON public.client_auditor_history (auditor_org_number);

CREATE INDEX IF NOT EXISTS idx_client_roles_client_id ON public.client_roles (client_id);
CREATE INDEX IF NOT EXISTS idx_client_roles_current ON public.client_roles (is_current);
CREATE INDEX IF NOT EXISTS idx_client_roles_type ON public.client_roles (role_type);

-- Create trigger function to automatically log client changes
CREATE OR REPLACE FUNCTION public.log_client_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Log CEO changes
  IF OLD.ceo IS DISTINCT FROM NEW.ceo THEN
    INSERT INTO public.client_history_logs (
      client_id, change_type, field_name, old_value, new_value, 
      change_source, description, change_metadata
    ) VALUES (
      NEW.id, 'role_change', 'ceo', OLD.ceo, NEW.ceo,
      'brreg_sync', 'CEO endret fra BRREG oppdatering',
      jsonb_build_object('sync_timestamp', now())
    );
  END IF;

  -- Log Chair changes
  IF OLD.chair IS DISTINCT FROM NEW.chair THEN
    INSERT INTO public.client_history_logs (
      client_id, change_type, field_name, old_value, new_value, 
      change_source, description, change_metadata
    ) VALUES (
      NEW.id, 'role_change', 'chair', OLD.chair, NEW.chair,
      'brreg_sync', 'Styreleder endret fra BRREG oppdatering',
      jsonb_build_object('sync_timestamp', now())
    );
  END IF;

  -- Log auditor changes
  IF OLD.current_auditor_org_number IS DISTINCT FROM NEW.current_auditor_org_number THEN
    INSERT INTO public.client_history_logs (
      client_id, change_type, field_name, old_value, new_value, 
      change_source, description, change_metadata
    ) VALUES (
      NEW.id, 'auditor_change', 'current_auditor_org_number', 
      OLD.current_auditor_org_number, NEW.current_auditor_org_number,
      'brreg_sync', 'Revisor endret fra BRREG oppdatering',
      jsonb_build_object('sync_timestamp', now())
    );
  END IF;

  -- Update sync timestamp
  NEW.last_brreg_sync_at = now();
  NEW.brreg_sync_version = COALESCE(NEW.brreg_sync_version, 0) + 1;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for client changes
DROP TRIGGER IF EXISTS log_client_changes_trigger ON public.clients;
CREATE TRIGGER log_client_changes_trigger
  BEFORE UPDATE ON public.clients
  FOR EACH ROW
  EXECUTE FUNCTION public.log_client_change();

-- Create function to update auditor history when auditor changes
CREATE OR REPLACE FUNCTION public.update_auditor_history()
RETURNS TRIGGER AS $$
BEGIN
  -- Mark previous auditor as not current
  UPDATE public.client_auditor_history 
  SET is_current = false, valid_to = CURRENT_DATE
  WHERE client_id = NEW.id AND is_current = true;

  -- Insert new auditor record if auditor changed
  IF OLD.current_auditor_org_number IS DISTINCT FROM NEW.current_auditor_org_number 
     AND NEW.current_auditor_org_number IS NOT NULL THEN
    INSERT INTO public.client_auditor_history (
      client_id, auditor_org_number, auditor_name, valid_from, 
      is_current, discovered_via
    ) VALUES (
      NEW.id, NEW.current_auditor_org_number, NEW.current_auditor_name, 
      COALESCE(NEW.auditor_since, CURRENT_DATE), true, 'brreg_sync'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auditor history
DROP TRIGGER IF EXISTS update_auditor_history_trigger ON public.clients;
CREATE TRIGGER update_auditor_history_trigger
  AFTER UPDATE ON public.clients
  FOR EACH ROW
  EXECUTE FUNCTION public.update_auditor_history();

-- Create function to get potential clients summary
CREATE OR REPLACE FUNCTION public.get_potential_clients_summary(p_auditor_org_number TEXT)
RETURNS TABLE(
  total_potential INTEGER,
  new_this_week INTEGER,
  converted INTEGER,
  lost INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::INTEGER as total_potential,
    COUNT(CASE WHEN discovered_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END)::INTEGER as new_this_week,
    COUNT(CASE WHEN status = 'converted' THEN 1 END)::INTEGER as converted,
    COUNT(CASE WHEN status = 'lost' THEN 1 END)::INTEGER as lost
  FROM public.potential_clients 
  WHERE auditor_org_number = p_auditor_org_number
    AND created_by = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;