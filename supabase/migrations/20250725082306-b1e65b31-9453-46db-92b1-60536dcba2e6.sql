-- Create comprehensive database structure for audit areas and account relationships

-- Create audit areas table (replacing/extending subject areas for audit-specific purposes)
CREATE TABLE public.audit_areas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  audit_number INTEGER NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#3B82F6',
  is_system_area BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create risk factors table for comprehensive risk management
CREATE TABLE public.risk_factors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  risk_number INTEGER NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  risk_category TEXT, -- e.g., 'inherent', 'control', 'detection'
  risk_level TEXT DEFAULT 'medium' CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  is_system_risk BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create mapping between standard accounts and audit areas
CREATE TABLE public.standard_account_audit_area_mappings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  standard_account_id UUID REFERENCES public.standard_accounts(id) ON DELETE CASCADE,
  audit_area_id UUID REFERENCES public.audit_areas(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT true,
  relevance_score NUMERIC DEFAULT 1.0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(standard_account_id, audit_area_id)
);

-- Create mapping between accounts and risk factors
CREATE TABLE public.account_risk_mappings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  standard_account_id UUID REFERENCES public.standard_accounts(id) ON DELETE CASCADE,
  risk_factor_id UUID REFERENCES public.risk_factors(id) ON DELETE CASCADE,
  risk_level TEXT DEFAULT 'medium' CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  impact_description TEXT,
  mitigation_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(standard_account_id, risk_factor_id)
);

-- Create related party indicators table
CREATE TABLE public.related_party_indicators (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  standard_account_id UUID REFERENCES public.standard_accounts(id) ON DELETE CASCADE,
  is_related_party BOOLEAN DEFAULT false,
  indicator_type TEXT, -- e.g., 'always', 'sometimes', 'rarely'
  description TEXT,
  disclosure_requirements TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(standard_account_id)
);

-- Create estimate indicators table
CREATE TABLE public.estimate_indicators (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  standard_account_id UUID REFERENCES public.standard_accounts(id) ON DELETE CASCADE,
  is_estimate BOOLEAN DEFAULT false,
  estimate_type TEXT, -- e.g., 'accounting_estimate', 'fair_value', 'provision'
  complexity_level TEXT DEFAULT 'medium' CHECK (complexity_level IN ('low', 'medium', 'high')),
  estimation_method TEXT,
  key_assumptions TEXT,
  sensitivity_analysis_required BOOLEAN DEFAULT false,
  audit_considerations TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(standard_account_id)
);

-- Create custom attributes table for user-defined columns
CREATE TABLE public.account_custom_attributes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  standard_account_id UUID REFERENCES public.standard_accounts(id) ON DELETE CASCADE,
  attribute_name TEXT NOT NULL,
  attribute_value TEXT,
  attribute_type TEXT DEFAULT 'text' CHECK (attribute_type IN ('text', 'number', 'boolean', 'date')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(standard_account_id, attribute_name)
);

-- Create import/export history table
CREATE TABLE public.data_import_exports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  operation_type TEXT NOT NULL CHECK (operation_type IN ('import', 'export')),
  file_name TEXT NOT NULL,
  file_size BIGINT,
  records_processed INTEGER DEFAULT 0,
  records_successful INTEGER DEFAULT 0,
  records_failed INTEGER DEFAULT 0,
  status TEXT DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
  error_details JSONB,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Add RLS policies for all new tables
ALTER TABLE public.audit_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.risk_factors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.standard_account_audit_area_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_risk_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.related_party_indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estimate_indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_custom_attributes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_import_exports ENABLE ROW LEVEL SECURITY;

-- RLS policies for audit_areas
CREATE POLICY "Everyone can view audit areas" ON public.audit_areas FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage audit areas" ON public.audit_areas FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- RLS policies for risk_factors
CREATE POLICY "Everyone can view risk factors" ON public.risk_factors FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage risk factors" ON public.risk_factors FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- RLS policies for mappings and indicators
CREATE POLICY "Everyone can view account audit area mappings" ON public.standard_account_audit_area_mappings FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage account audit area mappings" ON public.standard_account_audit_area_mappings FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Everyone can view account risk mappings" ON public.account_risk_mappings FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage account risk mappings" ON public.account_risk_mappings FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Everyone can view related party indicators" ON public.related_party_indicators FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage related party indicators" ON public.related_party_indicators FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Everyone can view estimate indicators" ON public.estimate_indicators FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage estimate indicators" ON public.estimate_indicators FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Everyone can view custom attributes" ON public.account_custom_attributes FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage custom attributes" ON public.account_custom_attributes FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can view their import/export history" ON public.data_import_exports FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can create import/export records" ON public.data_import_exports FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update their import/export records" ON public.data_import_exports FOR UPDATE USING (user_id = auth.uid());

-- Create indexes for better performance
CREATE INDEX idx_audit_areas_audit_number ON public.audit_areas(audit_number);
CREATE INDEX idx_risk_factors_risk_number ON public.risk_factors(risk_number);
CREATE INDEX idx_standard_account_audit_area_mappings_standard_account ON public.standard_account_audit_area_mappings(standard_account_id);
CREATE INDEX idx_standard_account_audit_area_mappings_audit_area ON public.standard_account_audit_area_mappings(audit_area_id);
CREATE INDEX idx_account_risk_mappings_standard_account ON public.account_risk_mappings(standard_account_id);
CREATE INDEX idx_account_risk_mappings_risk_factor ON public.account_risk_mappings(risk_factor_id);
CREATE INDEX idx_related_party_indicators_standard_account ON public.related_party_indicators(standard_account_id);
CREATE INDEX idx_estimate_indicators_standard_account ON public.estimate_indicators(standard_account_id);
CREATE INDEX idx_account_custom_attributes_standard_account ON public.account_custom_attributes(standard_account_id);
CREATE INDEX idx_data_import_exports_user_id ON public.data_import_exports(user_id);

-- Add updated_at triggers
CREATE TRIGGER update_audit_areas_updated_at BEFORE UPDATE ON public.audit_areas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_risk_factors_updated_at BEFORE UPDATE ON public.risk_factors FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_standard_account_audit_area_mappings_updated_at BEFORE UPDATE ON public.standard_account_audit_area_mappings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_account_risk_mappings_updated_at BEFORE UPDATE ON public.account_risk_mappings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_related_party_indicators_updated_at BEFORE UPDATE ON public.related_party_indicators FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_estimate_indicators_updated_at BEFORE UPDATE ON public.estimate_indicators FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_account_custom_attributes_updated_at BEFORE UPDATE ON public.account_custom_attributes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some initial audit areas based on your requirements
INSERT INTO public.audit_areas (audit_number, name, description, color, is_system_area, sort_order) VALUES
(100, 'Lønn', 'Lønnskostnader og relaterte poster', '#10B981', true, 1),
(200, 'Salg', 'Salgsinntekter og kundefordringer', '#3B82F6', true, 2),
(300, 'Varelager', 'Lagerbeholdning og varekostnader', '#F59E0B', true, 3),
(400, 'Kostnader', 'Driftskostnader og leverandørgjeld', '#EF4444', true, 4),
(500, 'Finans', 'Finansinntekter og finanskostnader', '#8B5CF6', true, 5),
(600, 'Bank', 'Bankinnskudd og kontanter', '#06B6D4', true, 6),
(700, 'Investeringer', 'Anleggsmidler og investeringer', '#84CC16', true, 7),
(800, 'Nærstående transaksjoner', 'Transaksjoner med nærstående parter', '#F97316', true, 8),
(900, 'Regnskapsrapportering', 'Regnskapsavleggelse og presentasjon', '#EC4899', true, 9);

-- Insert some initial risk factors
INSERT INTO public.risk_factors (risk_number, name, description, risk_category, risk_level, is_system_risk, sort_order) VALUES
(100, 'Salgsinntekter - innregning', 'Risiko for feil tidspunkt for inntektsføring', 'inherent', 'high', true, 1),
(200, 'Lønn - periodisering', 'Risiko for feil periodisering av lønnskostnader', 'inherent', 'medium', true, 2),
(300, 'Varelager - verdsettelse', 'Risiko for feil verdsettelse av lagerbeholdning', 'inherent', 'high', true, 3),
(400, 'Nærstående transaksjoner', 'Risiko for ikke-oppdagede nærstående transaksjoner', 'inherent', 'high', true, 4),
(500, 'Ledelsens overstyring', 'Risiko for ledelsens overstyring av kontroller', 'control', 'critical', true, 5),
(600, 'IT-kontroller', 'Risiko ved svake IT-generelle kontroller', 'control', 'medium', true, 6),
(700, 'Estimater og vurderinger', 'Risiko ved regnskapsmessige estimater', 'inherent', 'high', true, 7);

COMMENT ON TABLE public.audit_areas IS 'Revisjonsområder med unike numre for klassifisering av regnskapslinjer';
COMMENT ON TABLE public.risk_factors IS 'Risikofaktorer for omfattende risikostyring';
COMMENT ON TABLE public.standard_account_audit_area_mappings IS 'Kobling mellom standard kontoer og revisjonsområder';
COMMENT ON TABLE public.account_risk_mappings IS 'Kobling mellom kontoer og risikofaktorer';
COMMENT ON TABLE public.related_party_indicators IS 'Indikatorer for nærstående transaksjoner';
COMMENT ON TABLE public.estimate_indicators IS 'Indikatorer for regnskapsmessige estimater';
COMMENT ON TABLE public.account_custom_attributes IS 'Egendefinerte attributter for fleksibel utvidelse';
COMMENT ON TABLE public.data_import_exports IS 'Historikk over Excel/CSV import og eksport operasjoner';