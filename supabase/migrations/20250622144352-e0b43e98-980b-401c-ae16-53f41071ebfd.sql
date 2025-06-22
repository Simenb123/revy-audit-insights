
-- Create ISA standards table
CREATE TABLE public.isa_standards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  isa_number VARCHAR(10) NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  effective_date DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create document requirements table  
CREATE TABLE public.document_requirements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  document_type TEXT NOT NULL,
  is_mandatory BOOLEAN NOT NULL DEFAULT true,
  subject_area TEXT,
  audit_phases TEXT[] DEFAULT ARRAY['execution'],
  file_pattern_hints TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create working paper templates table
CREATE TABLE public.working_paper_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  template_structure JSONB NOT NULL DEFAULT '{}',
  subject_area TEXT NOT NULL,
  action_type TEXT NOT NULL,
  is_system_template BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  audit_firm_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create audit action ISA mappings table
CREATE TABLE public.audit_action_isa_mappings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  action_template_id UUID REFERENCES public.audit_action_templates(id) ON DELETE CASCADE,
  isa_standard_id UUID REFERENCES public.isa_standards(id) ON DELETE CASCADE,
  relevance_level TEXT NOT NULL DEFAULT 'primary' CHECK (relevance_level IN ('primary', 'secondary', 'reference')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(action_template_id, isa_standard_id)
);

-- Create audit action document requirements mappings
CREATE TABLE public.audit_action_document_mappings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  action_template_id UUID REFERENCES public.audit_action_templates(id) ON DELETE CASCADE,
  document_requirement_id UUID REFERENCES public.document_requirements(id) ON DELETE CASCADE,
  is_mandatory BOOLEAN NOT NULL DEFAULT true,
  timing TEXT DEFAULT 'during' CHECK (timing IN ('before', 'during', 'after')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(action_template_id, document_requirement_id)
);

-- Create AI training metadata table for actions
CREATE TABLE public.action_ai_metadata (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  action_template_id UUID REFERENCES public.audit_action_templates(id) ON DELETE CASCADE UNIQUE,
  ai_variant_id UUID REFERENCES public.ai_revy_variants(id),
  specialized_prompt TEXT,
  common_issues JSONB DEFAULT '[]',
  typical_documents JSONB DEFAULT '[]',
  risk_indicators JSONB DEFAULT '[]',
  quality_checkpoints JSONB DEFAULT '[]',
  estimated_complexity INTEGER DEFAULT 3 CHECK (estimated_complexity BETWEEN 1 AND 5),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add some sample ISA standards
INSERT INTO public.isa_standards (isa_number, title, description, category, effective_date) VALUES
('ISA 200', 'Overall Objectives of the Independent Auditor', 'Establishes the overall objectives of the independent auditor', 'General Principles', '2009-12-15'),
('ISA 230', 'Audit Documentation', 'Deals with auditor responsibility for preparing audit documentation', 'General Principles', '2009-12-15'),
('ISA 300', 'Planning an Audit of Financial Statements', 'Establishes standards on planning an audit of financial statements', 'Planning', '2009-12-15'),
('ISA 315', 'Identifying and Assessing the Risks of Material Misstatement', 'Risk assessment procedures and related activities', 'Risk Assessment', '2019-12-15'),
('ISA 330', 'The Auditors Responses to Assessed Risks', 'Auditor responses to assessed risks of material misstatement', 'Risk Assessment', '2009-12-15'),
('ISA 500', 'Audit Evidence', 'What constitutes audit evidence and quantity and quality required', 'Audit Evidence', '2009-12-15'),
('ISA 505', 'External Confirmations', 'Use of external confirmation procedures to obtain audit evidence', 'Audit Evidence', '2009-12-15'),
('ISA 510', 'Initial Audit Engagements', 'Opening balances in initial audit engagements', 'Audit Evidence', '2009-12-15'),
('ISA 520', 'Analytical Procedures', 'Application of analytical procedures during an audit', 'Audit Evidence', '2009-12-15'),
('ISA 530', 'Audit Sampling', 'Use of sampling in performing audit procedures', 'Audit Evidence', '2009-12-15');

-- Add some sample document requirements
INSERT INTO public.document_requirements (name, description, document_type, subject_area, audit_phases, file_pattern_hints) VALUES
('Bankbekreftelser', 'Bekreftelser fra bank på saldi og vilkår', 'bank_confirmation', 'banking', ARRAY['execution'], ARRAY['bankbekreftelse', 'bank_confirmation', 'saldo']),
('Lønnsspecifikasjoner', 'Detaljerte lønnsutbetalinger og trekk', 'payroll_specification', 'payroll', ARRAY['execution'], ARRAY['lønnsliste', 'payroll', 'lønn']),
('Varelagertelling', 'Dokumentasjon av fysisk lagertelling', 'inventory_count', 'inventory', ARRAY['execution'], ARRAY['lagertelling', 'inventory', 'telling']),
('Fakturaer', 'Salgsfakturaer og innkjøpsfakturaer', 'invoice', 'sales', ARRAY['execution'], ARRAY['faktura', 'invoice', 'regning']),
('Kontrakter', 'Avtaler og kontrakter', 'contract', 'other', ARRAY['planning', 'execution'], ARRAY['kontrakt', 'avtale', 'contract']),
('Årsregnskap', 'Komplett årsregnskap med noter', 'annual_report', 'other', ARRAY['planning', 'conclusion'], ARRAY['årsregnskap', 'annual_report', 'regnskap']);

-- Enable RLS on new tables
ALTER TABLE public.isa_standards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.working_paper_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_action_isa_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_action_document_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.action_ai_metadata ENABLE ROW LEVEL SECURITY;

-- Create policies for ISA standards (read-only for all authenticated users)
CREATE POLICY "ISA standards are readable by all authenticated users" 
  ON public.isa_standards 
  FOR SELECT 
  TO authenticated 
  USING (true);

-- Create policies for document requirements (read-only for all authenticated users)
CREATE POLICY "Document requirements are readable by all authenticated users" 
  ON public.document_requirements 
  FOR SELECT 
  TO authenticated 
  USING (true);

-- Create policies for working paper templates (users can read all, create/update their own)
CREATE POLICY "Working paper templates are readable by all authenticated users" 
  ON public.working_paper_templates 
  FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Users can create working paper templates" 
  ON public.working_paper_templates 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own working paper templates" 
  ON public.working_paper_templates 
  FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = created_by);

-- Create policies for mapping tables (readable by all authenticated users)
CREATE POLICY "Action ISA mappings are readable by all authenticated users" 
  ON public.audit_action_isa_mappings 
  FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Action document mappings are readable by all authenticated users" 
  ON public.audit_action_document_mappings 
  FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Action AI metadata is readable by all authenticated users" 
  ON public.action_ai_metadata 
  FOR SELECT 
  TO authenticated 
  USING (true);

-- Add triggers for updated_at
CREATE TRIGGER set_updated_at_isa_standards
  BEFORE UPDATE ON public.isa_standards
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_updated_at_document_requirements
  BEFORE UPDATE ON public.document_requirements
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_updated_at_working_paper_templates
  BEFORE UPDATE ON public.working_paper_templates
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_updated_at_action_ai_metadata
  BEFORE UPDATE ON public.action_ai_metadata
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
