-- Phase 1: Fix engagement_type null values and add robust client system

-- Fix existing engagement_type null values
UPDATE public.clients 
SET engagement_type = 'revisjon' 
WHERE engagement_type IS NULL;

-- Add NOT NULL constraint with default value
ALTER TABLE public.clients 
ALTER COLUMN engagement_type SET DEFAULT 'revisjon';

-- Create client_custom_fields table for extensible client data
CREATE TABLE public.client_custom_fields (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  field_name TEXT NOT NULL,
  field_label TEXT NOT NULL,
  field_type TEXT NOT NULL DEFAULT 'text', -- text, number, date, select, checkbox, textarea
  field_options JSONB DEFAULT '[]'::jsonb, -- For select/radio options
  is_required BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  audit_firm_id UUID REFERENCES public.audit_firms(id),
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  validation_rules JSONB DEFAULT '{}'::jsonb, -- min/max, regex, etc.
  help_text TEXT,
  UNIQUE(field_name, audit_firm_id)
);

-- Create client_custom_field_values table for storing custom field values
CREATE TABLE public.client_custom_field_values (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  custom_field_id UUID NOT NULL REFERENCES public.client_custom_fields(id) ON DELETE CASCADE,
  field_value TEXT, -- Store all values as text, convert based on field_type
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(client_id, custom_field_id)
);

-- Create client_shareholders table for ownership data
CREATE TABLE public.client_shareholders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  shareholder_name TEXT NOT NULL,
  shareholder_org_number TEXT, -- For legal entities
  shareholder_type TEXT NOT NULL DEFAULT 'person', -- person, company, trust, etc.
  ownership_percentage NUMERIC(5,2), -- e.g., 25.50%
  number_of_shares INTEGER,
  share_class TEXT DEFAULT 'ordinary',
  voting_rights_percentage NUMERIC(5,2),
  registered_date DATE,
  is_active BOOLEAN DEFAULT true,
  address_line1 TEXT,
  address_line2 TEXT,
  postal_code TEXT,
  city TEXT,
  country TEXT DEFAULT 'Norge',
  phone TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_brreg_sync_at TIMESTAMP WITH TIME ZONE,
  brreg_data JSONB DEFAULT '{}'::jsonb -- Store raw data from Brønnøysund
);

-- Create client_filters table for saved filter configurations
CREATE TABLE public.client_filters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  filter_name TEXT NOT NULL,
  filter_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_default BOOLEAN DEFAULT false,
  is_public BOOLEAN DEFAULT false, -- Share with other users in firm
  created_by UUID REFERENCES public.profiles(id),
  audit_firm_id UUID REFERENCES public.audit_firms(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create client_view_configurations table for customizable column display
CREATE TABLE public.client_view_configurations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  view_name TEXT NOT NULL DEFAULT 'default',
  visible_columns JSONB NOT NULL DEFAULT '[]'::jsonb,
  column_order JSONB NOT NULL DEFAULT '[]'::jsonb,
  column_widths JSONB DEFAULT '{}'::jsonb,
  sort_config JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, view_name)
);

-- Enable RLS on all new tables
ALTER TABLE public.client_custom_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_custom_field_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_shareholders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_filters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_view_configurations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for client_custom_fields
CREATE POLICY "Users can view custom fields for their firm" 
ON public.client_custom_fields FOR SELECT 
USING (audit_firm_id = get_user_firm(auth.uid()) OR audit_firm_id IS NULL);

CREATE POLICY "Admins can manage custom fields for their firm" 
ON public.client_custom_fields FOR ALL 
USING (audit_firm_id = get_user_firm(auth.uid()) AND get_user_role(auth.uid()) = ANY(ARRAY['admin'::user_role_type, 'partner'::user_role_type, 'manager'::user_role_type]))
WITH CHECK (audit_firm_id = get_user_firm(auth.uid()) AND get_user_role(auth.uid()) = ANY(ARRAY['admin'::user_role_type, 'partner'::user_role_type, 'manager'::user_role_type]));

-- RLS Policies for client_custom_field_values
CREATE POLICY "Users can manage custom field values for their clients" 
ON public.client_custom_field_values FOR ALL 
USING (client_id IN (
  SELECT c.id FROM public.clients c 
  WHERE c.department_id = get_user_department(auth.uid()) 
  OR c.id IN (SELECT ct.client_id FROM public.client_teams ct WHERE ct.id IN (SELECT get_user_team_ids(auth.uid())))
  OR get_user_role(auth.uid()) = ANY(ARRAY['admin'::user_role_type, 'partner'::user_role_type])
));

-- RLS Policies for client_shareholders
CREATE POLICY "Users can manage shareholders for their clients" 
ON public.client_shareholders FOR ALL 
USING (client_id IN (
  SELECT c.id FROM public.clients c 
  WHERE c.department_id = get_user_department(auth.uid()) 
  OR c.id IN (SELECT ct.client_id FROM public.client_teams ct WHERE ct.id IN (SELECT get_user_team_ids(auth.uid())))
  OR get_user_role(auth.uid()) = ANY(ARRAY['admin'::user_role_type, 'partner'::user_role_type])
));

-- RLS Policies for client_filters
CREATE POLICY "Users can manage their own filters" 
ON public.client_filters FOR ALL 
USING (created_by = auth.uid());

CREATE POLICY "Users can view public filters from their firm" 
ON public.client_filters FOR SELECT 
USING (is_public = true AND audit_firm_id = get_user_firm(auth.uid()));

-- RLS Policies for client_view_configurations
CREATE POLICY "Users can manage their own view configurations" 
ON public.client_view_configurations FOR ALL 
USING (user_id = auth.uid());

-- Add indexes for performance
CREATE INDEX idx_client_custom_fields_audit_firm ON public.client_custom_fields(audit_firm_id);
CREATE INDEX idx_client_custom_field_values_client ON public.client_custom_field_values(client_id);
CREATE INDEX idx_client_shareholders_client ON public.client_shareholders(client_id);
CREATE INDEX idx_client_shareholders_org_number ON public.client_shareholders(shareholder_org_number);
CREATE INDEX idx_client_filters_firm ON public.client_filters(audit_firm_id);
CREATE INDEX idx_client_view_configurations_user ON public.client_view_configurations(user_id);

-- Add triggers for updated_at
CREATE TRIGGER update_client_custom_fields_updated_at
    BEFORE UPDATE ON public.client_custom_fields
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_client_custom_field_values_updated_at
    BEFORE UPDATE ON public.client_custom_field_values
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_client_shareholders_updated_at
    BEFORE UPDATE ON public.client_shareholders
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_client_filters_updated_at
    BEFORE UPDATE ON public.client_filters
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_client_view_configurations_updated_at
    BEFORE UPDATE ON public.client_view_configurations
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();